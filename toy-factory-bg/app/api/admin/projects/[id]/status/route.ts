import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ProjectStatus, updateProject } from "@/lib/projects";
import { MANUAL_PRODUCTION_STATUSES } from "@/lib/status";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status || "") as ProjectStatus;
    if (!MANUAL_PRODUCTION_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid production status" }, { status: 400 });
    const project = await updateProject(id, {
      status,
      production_notes: String(body?.productionNotes || "").slice(0, 5000) || null,
      tracking_number: String(body?.trackingNumber || "").slice(0, 250) || null,
      last_error: null,
    });
    return NextResponse.json({ ok: true, project });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }); }
}
