import { NextResponse } from "next/server";
import { syncActiveProjects } from "@/lib/production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const results = await syncActiveProjects(50);
    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cron sync failed" }, { status: 500 });
  }
}
