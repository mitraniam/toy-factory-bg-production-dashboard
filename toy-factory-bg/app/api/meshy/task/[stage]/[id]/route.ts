import { NextRequest, NextResponse } from "next/server";
import { getTask, type MeshyStage, type ModelKind } from "@/lib/meshy";

export const runtime = "nodejs";

type Params = Promise<{ stage: string; id: string }>;

function isModelKind(value: unknown): value is ModelKind {
  return value === "pop" || value === "mini" || value === "brick";
}

export async function GET(request: NextRequest, context: { params: Params }) {
  try {
    const { stage, id } = await context.params;
    const modelKind = request.nextUrl.searchParams.get("modelKind") || "pop";

    if (stage !== "prototype" && stage !== "build") {
      return NextResponse.json({ error: "Невалиден етап." }, { status: 400 });
    }
    if (!isModelKind(modelKind)) {
      return NextResponse.json({ error: "Невалиден стил на фигурката." }, { status: 400 });
    }

    const task = await getTask(modelKind, stage as MeshyStage, id);
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
