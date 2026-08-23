import { NextResponse } from "next/server";
import { createPrototype, type ModelKind } from "@/lib/meshy";

export const runtime = "nodejs";

const MAX_DATA_URI_LENGTH = 4_000_000;

function isModelKind(value: unknown): value is ModelKind {
  return value === "pop" || value === "mini" || value === "brick";
}

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
