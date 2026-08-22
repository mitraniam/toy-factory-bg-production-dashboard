import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncActiveProjects } from "@/lib/production";
export const runtime = "nodejs";
export async function POST() {
  try { await requireAdmin(); return NextResponse.json({ ok: true, results: await syncActiveProjects() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed" }, { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }); }
}
