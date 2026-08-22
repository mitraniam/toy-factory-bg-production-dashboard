import { createBuild, createMultiColorPrint, getMultiColorPrint, getTask } from "@/lib/meshy";
import { getProject, listProjectsByStatuses, ProjectStatus, ToyProject, updateProject } from "@/lib/projects";

function taskError(task: { task_error?: { message?: string } | null }, fallback: string) {
  return task.task_error?.message || fallback;
}

export async function syncProject(input: string | ToyProject) {
  let project = typeof input === "string" ? await getProject(input) : input;
  if (!project) throw new Error("Project not found.");

  if (project.status === "PAID_BUILD_STARTING") {
    try {
      const buildTaskId = await createBuild(project.prototype_task_id);
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
    const task = await getTask("build", project.build_task_id);
    if (task.status === "FAILED" || task.status === "EXPIRED") {
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
        const printTaskId = await createMultiColorPrint(glbUrl);
        project = (await updateProject(project.id, {
          glb_url: glbUrl,
          print_task_id: printTaskId,
          status: "PRINT_FILE_GENERATING",
          last_error: null,
        })) || project;
      } catch (error) {
        return updateProject(project.id, {
          glb_url: glbUrl,
          status: "PRINT_FILE_FAILED",
          last_error: error instanceof Error ? error.message : "3MF task failed to start",
        });
      }
    }
  }

  if (project.status === "PRINT_FILE_GENERATING" && project.print_task_id) {
    const task = await getMultiColorPrint(project.print_task_id);
    if (task.status === "FAILED" || task.status === "EXPIRED") {
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
      return updateProject(project.id, {
        status: "READY_FOR_PRINT",
        three_mf_url: threeMf,
        last_error: null,
      });
    }
  }

  return project;
}

export async function syncActiveProjects(limit = 40) {
  const active: ProjectStatus[] = ["PAID_BUILD_STARTING", "3D_GENERATING", "PRINT_FILE_GENERATING"];
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
    const buildTaskId = await createBuild(project.prototype_task_id);
    return updateProject(project.id, {
      status: "3D_GENERATING",
      build_task_id: buildTaskId,
      print_task_id: null,
      three_mf_url: null,
      last_error: null,
    });
  }
  if (project.status === "PRINT_FILE_FAILED") {
    if (!project.glb_url) throw new Error("GLB URL is missing; retry the 3D build instead.");
    const printTaskId = await createMultiColorPrint(project.glb_url);
    return updateProject(project.id, {
      status: "PRINT_FILE_GENERATING",
      print_task_id: printTaskId,
      three_mf_url: null,
      last_error: null,
    });
  }
  throw new Error("This project is not in a retryable state.");
}
