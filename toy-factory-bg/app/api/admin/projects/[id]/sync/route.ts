import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncProject } from "@/lib/production";
export const runtime = "nodejs";
// 3MF post-processing of a ~100 MB Meshy file takes ~10-20 s.
export const maxDuration = 120;
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); const { id } = await params; return NextResponse.json({ ok: true, project: await syncProject(id) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed" }, { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }); }
}
