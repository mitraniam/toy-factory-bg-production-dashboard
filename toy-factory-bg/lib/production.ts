import { createBuild, createMultiColorPrint, createResize, getMultiColorPrint, getResize, getTask } from "@/lib/meshy";
import { getProject, listProjectsByStatuses, ProjectStatus, ToyProject, updateProject } from "@/lib/projects";
import { archiveRemoteAsset } from "@/lib/storage";

function taskError(task: { task_error?: { message?: string } | null }, fallback: string) {
  return task.task_error?.message || fallback;
}

function failed(status: string) {
  return status === "FAILED" || status === "EXPIRED" || status === "CANCELED";
}

async function archiveGlb(project: ToyProject, sourceUrl: string) {
  if (project.glb_storage_path) return project.glb_storage_path;
  return archiveRemoteAsset({
    projectId: project.id,
    sourceUrl,
    filename: "model.glb",
    contentType: "model/gltf-binary",
  });
}

async function archiveThreeMf(project: ToyProject, sourceUrl: string) {
  if (project.three_mf_storage_path) return project.three_mf_storage_path;
  return archiveRemoteAsset({
    projectId: project.id,
    sourceUrl,
    filename: "model.3mf",
    contentType: "model/3mf",
  });
}

export async function syncProject(input: string | ToyProject) {
  let project = typeof input === "string" ? await getProject(input) : input;
  if (!project) throw new Error("Project not found.");

  if (project.status === "PAID_BUILD_STARTING") {
    try {
      const buildTaskId = await createBuild(project.model_kind || "pop", project.prototype_task_id);
      project = (await updateProject(project.id, {
        status: "3D_GENERATING",
        build_task_id: buildTaskId,
        last_error: null,
      })) || project;
    } catch (error) {
      return updateProject(project.id, {
        status: "BUILD_FAILED",
        last_error: error instanceof Error ? error.message : "Meshy build failed",
      });
    }
  }

  if (project.status === "3D_GENERATING" && project.build_task_id) {
    const task = await getTask(project.model_kind || "pop", "build", project.build_task_id);
    if (failed(task.status)) {
      return updateProject(project.id, {
        status: "BUILD_FAILED",
        last_error: taskError(task, `Build ${task.status.toLowerCase()}`),
      });
    }
    if (task.status === "SUCCEEDED") {
      const glbUrl = task.model_urls?.glb;
      if (!glbUrl) {
        return updateProject(project.id, {
          status: "BUILD_FAILED",
          last_error: "Meshy build succeeded but no GLB URL was returned.",
        });
      }
      try {
        const resizeTaskId = await createResize(glbUrl, project.size_cm);
        project = (await updateProject(project.id, {
          glb_url: glbUrl,
          resize_task_id: resizeTaskId,
          status: "MODEL_RESIZING",
          last_error: null,
        })) || project;
      } catch (error) {
        return updateProject(project.id, {
          glb_url: glbUrl,
          status: "PRINT_FILE_FAILED",
          last_error: error instanceof Error ? error.message : "Resize task failed to start",
        });
      }
    }
  }

  if (project.status === "MODEL_RESIZING" && project.resize_task_id) {
    const task = await getResize(project.resize_task_id);
    if (failed(task.status)) {
      return updateProject(project.id, {
        status: "PRINT_FILE_FAILED",
        last_error: taskError(task, `Resize ${task.status.toLowerCase()}`),
      });
    }
    if (task.status === "SUCCEEDED") {
      const resizedGlb = task.model_urls?.glb;
      if (!resizedGlb) {
        return updateProject(project.id, {
          status: "PRINT_FILE_FAILED",
          last_error: "Meshy resize succeeded but no GLB URL was returned.",
        });
      }
      try {
        const glbStoragePath = await archiveGlb(project, resizedGlb);
        const printTaskId = await createMultiColorPrint(resizedGlb);
        project = (await updateProject(project.id, {
          glb_url: resizedGlb,
          glb_storage_path: glbStoragePath,
          print_task_id: printTaskId,
          status: "PRINT_FILE_GENERATING",
          last_error: null,
        })) || project;
      } catch (error) {
        return updateProject(project.id, {
          glb_url: resizedGlb,
          status: "PRINT_FILE_FAILED",
          last_error: error instanceof Error ? error.message : "GLB archive or 3MF task failed to start",
        });
      }
    }
  }

  if (project.status === "PRINT_FILE_GENERATING" && project.print_task_id) {
    const task = await getMultiColorPrint(project.print_task_id);
    if (failed(task.status)) {
      return updateProject(project.id, {
        status: "PRINT_FILE_FAILED",
        last_error: taskError(task, `3MF task ${task.status.toLowerCase()}`),
      });
    }
    if (task.status === "SUCCEEDED") {
      const threeMf = task.model_urls?.["3mf"];
      if (!threeMf) {
        return updateProject(project.id, {
          status: "PRINT_FILE_FAILED",
          last_error: "Meshy print task succeeded but no 3MF URL was returned.",
        });
      }
      try {
        const threeMfStoragePath = await archiveThreeMf(project, threeMf);
        return updateProject(project.id, {
          status: "READY_FOR_PRINT",
          three_mf_url: threeMf,
          three_mf_storage_path: threeMfStoragePath,
          last_error: null,
        });
      } catch (error) {
        return updateProject(project.id, {
          three_mf_url: threeMf,
          status: "PRINT_FILE_FAILED",
          last_error: error instanceof Error ? error.message : "3MF archive failed",
        });
      }
    }
  }

  return project;
}

export async function syncActiveProjects(limit = 40) {
  const active: ProjectStatus[] = ["PAID_BUILD_STARTING", "3D_GENERATING", "MODEL_RESIZING", "PRINT_FILE_GENERATING"];
  const projects = await listProjectsByStatuses(active, limit);
  const results: Array<{ id: string; ok: boolean; status?: string; error?: string }> = [];
  for (const project of projects) {
    try {
      const updated = await syncProject(project);
      results.push({ id: project.id, ok: true, status: updated?.status || project.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      await updateProject(project.id, { last_error: message }).catch(() => null);
      results.push({ id: project.id, ok: false, error: message });
    }
  }
  return results;
}

export async function retryProject(project: ToyProject) {
  if (project.status === "BUILD_FAILED") {
    const buildTaskId = await createBuild(project.model_kind || "pop", project.prototype_task_id);
    return updateProject(project.id, {
      status: "3D_GENERATING",
      build_task_id: buildTaskId,
      resize_task_id: null,
      print_task_id: null,
      three_mf_url: null,
      three_mf_storage_path: null,
      last_error: null,
    });
  }
  if (project.status === "PRINT_FILE_FAILED") {
    if (!project.glb_url) throw new Error("GLB URL is missing; retry the 3D build instead.");
    const resizeTaskId = await createResize(project.glb_url, project.size_cm);
    return updateProject(project.id, {
      status: "MODEL_RESIZING",
      resize_task_id: resizeTaskId,
      print_task_id: null,
      three_mf_url: null,
      three_mf_storage_path: null,
      last_error: null,
    });
  }
  throw new Error("This project is not in a retryable state.");
}
