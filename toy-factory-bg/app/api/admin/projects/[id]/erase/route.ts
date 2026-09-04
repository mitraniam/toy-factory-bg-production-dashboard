import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getProject } from "@/lib/projects";
import { eraseProject } from "@/lib/retention";

export const runtime = "nodejs";
export const maxDuration = 120;

type Params = Promise<{ id: string }>;

/**
 * GDPR erasure: deletes the archived preview, GLB and 3MF plus the project row.
 * Irreversible, so the client must send { confirm: "<project id>" }.
 */
export async function POST(request: NextRequest, context: { params: Params }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (String(body?.confirm || "") !== id) {
      return NextResponse.json({ error: "Missing confirmation." }, { status: 400 });
    }

    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const deleted = await eraseProject(project);
    console.info("project erased on request", { projectId: id, deleted });
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erase failed";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
