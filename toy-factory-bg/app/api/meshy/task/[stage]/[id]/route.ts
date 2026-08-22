import { NextResponse } from "next/server";
import { getTask, type MeshyStage } from "@/lib/meshy";

export const runtime = "nodejs";

type Params = Promise<{ stage: string; id: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  try {
    const { stage, id } = await context.params;

    if (stage !== "prototype" && stage !== "build") {
      return NextResponse.json({ error: "Невалиден етап." }, { status: 400 });
    }

    const task = await getTask(stage as MeshyStage, id);
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
