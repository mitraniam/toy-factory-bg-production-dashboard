import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncActiveProjects } from "@/lib/production";
import { runWatchdog } from "@/lib/watchdog";
export const runtime = "nodejs";
// 3MF post-processing of a ~100 MB Meshy file takes ~10-20 s.
export const maxDuration = 120;
export async function POST() {
  try {
    await requireAdmin();
    const results = await syncActiveProjects();
    const alerts = await runWatchdog().catch(() => []);
    return NextResponse.json({ ok: true, results, alerts });
  }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed" }, { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }); }
}
