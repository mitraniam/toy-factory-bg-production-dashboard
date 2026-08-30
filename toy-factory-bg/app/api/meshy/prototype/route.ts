import { NextResponse } from "next/server";
import { createPrototype, type ModelKind } from "@/lib/meshy";
import { consumeRateLimit, requestClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_DATA_URI_LENGTH = 4_000_000;
const PREVIEW_LIMIT = 6;
const PREVIEW_WINDOW_SECONDS = 60 * 60;

function isModelKind(value: unknown): value is ModelKind {
  return value === "pop" || value === "mini" || value === "brick";
}

export async function POST(request: Request) {
  try {
    const rate = await consumeRateLimit({
      scope: "meshy-preview-hour",
      key: requestClientKey(request),
      windowSeconds: PREVIEW_WINDOW_SECONDS,
      limit: PREVIEW_LIMIT,
    });

    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((new Date(rate.resetAt).getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Достигна лимита за AI визуализации. Опитай отново малко по-късно." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(PREVIEW_LIMIT),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();
    const image = body?.image;
    const modelKind = body?.modelKind;

    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Невалидно изображение." }, { status: 400 });
    }
    if (!isModelKind(modelKind)) {
      return NextResponse.json({ error: "Невалиден стил на фигурката." }, { status: 400 });
    }
    if (image.length > MAX_DATA_URI_LENGTH) {
      return NextResponse.json({ error: "Снимката е твърде голяма." }, { status: 413 });
    }

    const taskId = await createPrototype(modelKind, image);
    return NextResponse.json(
      { taskId },
      { headers: { "X-RateLimit-Remaining": String(rate.remaining) } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
