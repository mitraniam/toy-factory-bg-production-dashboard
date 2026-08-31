import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createMultiColorPrint } from "@/lib/meshy";
import { ensureProjectAssetArchived } from "@/lib/project-assets";
import { getProject, updateProject } from "@/lib/projects";
import { createSignedAssetUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.three_mf_storage_path) {
    return NextResponse.json({ ok: true, alreadyArchived: true });
  }

  try {
    // Recover/archive the resized GLB first. Meshy cannot read our private
    // bucket directly, so give the new print task a short-lived signed GLB URL.
    const glbPath = await ensureProjectAssetArchived(project, "glb");
    const signedGlbUrl = await createSignedAssetUrl(glbPath, 60 * 60);
    const printTaskId = await createMultiColorPrint(signedGlbUrl);

    await updateProject(project.id, {
      print_task_id: printTaskId,
      three_mf_url: null,
      three_mf_storage_path: null,
      status: "PRINT_FILE_GENERATING",
      last_error: null,
    });

    return NextResponse.json({ ok: true, printTaskId, status: "PRINT_FILE_GENERATING" }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not regenerate 3MF";
    await updateProject(project.id, { last_error: message }).catch(() => null);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
