import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getProject, ProjectStatus, updateProject } from "@/lib/projects";
import { MANUAL_PRODUCTION_STATUSES } from "@/lib/status";

const ALLOWED_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  READY_FOR_PRINT: ["READY_FOR_PRINT", "PRINTING", "CANCELLED"],
  PRINTING: ["PRINTING", "PRINTED", "CANCELLED"],
  PRINTED: ["PRINTED", "PACKED", "CANCELLED"],
  PACKED: ["PACKED", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED"],
  CANCELLED: ["CANCELLED"],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status || "") as ProjectStatus;

    if (!MANUAL_PRODUCTION_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid production status" }, { status: 400 });
    }

    const current = await getProject(id);
    if (!current) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const allowed = ALLOWED_TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${current.status} → ${status}` },
        { status: 409 }
      );
    }

    const project = await updateProject(id, {
      status,
      production_notes: String(body?.productionNotes || "").slice(0, 5000) || null,
      tracking_number: String(body?.trackingNumber || "").slice(0, 250) || null,
      last_error: null,
    });
    return NextResponse.json({ ok: true, project });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
