import { NextRequest, NextResponse } from "next/server";
import { getTask, type ModelKind } from "@/lib/meshy";
import { consumeRateLimit, requestClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Params = Promise<{ stage: string; id: string }>;

// Only the free prototype stage is readable from the browser. The paid build
// stage (GLB of a purchased model) is read exclusively by admin/sync code.
const PUBLIC_STAGE = "prototype";
const POLL_LIMIT = 300;
const POLL_WINDOW_SECONDS = 60 * 60;
const TASK_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

function isModelKind(value: unknown): value is ModelKind {
  return value === "pop" || value === "mini" || value === "brick";
}

export async function GET(request: NextRequest, context: { params: Params }) {
  try {
    const { stage, id } = await context.params;
    const modelKind = request.nextUrl.searchParams.get("modelKind") || "pop";

    if (stage !== PUBLIC_STAGE) {
      return NextResponse.json({ error: "Невалиден етап." }, { status: 404 });
    }
    if (!isModelKind(modelKind)) {
      return NextResponse.json({ error: "Невалиден стил на фигурката." }, { status: 400 });
    }
    if (!TASK_ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Невалиден task id." }, { status: 400 });
    }

    const rate = await consumeRateLimit({
      scope: "meshy-task-poll-hour",
      key: requestClientKey(request),
      windowSeconds: POLL_WINDOW_SECONDS,
      limit: POLL_LIMIT,
    });
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((new Date(rate.resetAt).getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Твърде много заявки. Опитай отново малко по-късно." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const task = await getTask(modelKind, PUBLIC_STAGE, id);
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
