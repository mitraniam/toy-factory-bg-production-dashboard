import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getTask } from "@/lib/meshy";
import { createProject, updateProject } from "@/lib/projects";
import { createToyCheckout, ToySize } from "@/lib/shopify";

export const runtime = "nodejs";

const PRICES: Record<ToySize, number> = {
  "10": 49,
  "15": 69,
  "20": 89,
};

function isToySize(value: unknown): value is ToySize {
  return value === "10" || value === "15" || value === "20";
}

function getBuyerIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: NextRequest) {
  let projectId: string | null = null;

  try {
    const body = await request.json();
    const prototypeTaskId = String(body?.prototypeTaskId || "");
    const size = body?.size;

    if (!prototypeTaskId) {
      return NextResponse.json({ error: "Липсва prototype task." }, { status: 400 });
    }
    if (!isToySize(size)) {
      return NextResponse.json({ error: "Невалиден размер." }, { status: 400 });
    }

    let previewUrl: string;

    if (process.env.NEXT_PUBLIC_MOCK_AI === "true" && prototypeTaskId === "mock-prototype-task") {
      previewUrl = String(body?.previewImage || "");
      if (!previewUrl) {
        return NextResponse.json({ error: "Липсва mock preview." }, { status: 400 });
      }
    } else {
      // Never trust a prototype id from the browser without checking Meshy server-side.
      const task = await getTask("prototype", prototypeTaskId);
      if (task.status !== "SUCCEEDED") {
        return NextResponse.json(
          { error: "Визуализацията още не е готова за поръчка." },
          { status: 409 }
        );
      }
      previewUrl = task.image_urls?.[0] || task.thumbnail_url || "";
      if (!previewUrl) {
        return NextResponse.json({ error: "Meshy не върна preview URL." }, { status: 502 });
      }
    }

    const newProjectId = randomUUID();
    projectId = newProjectId;

    await createProject({
      id: newProjectId,
      prototype_task_id: prototypeTaskId,
      preview_url: previewUrl,
      size_cm: Number(size),
      price_eur: PRICES[size],
      status: "CHECKOUT_CREATED",
      shopify_cart_id: null,
      shopify_order_id: null,
      shopify_order_name: null,
      shopify_webhook_id: null,
      paid_at: null,
      build_task_id: null,
      glb_url: null,
      three_mf_url: null,
      last_error: null,
    });

    try {
      const cart = await createToyCheckout({
        size,
        projectId: newProjectId,
        buyerIp: getBuyerIp(request),
      });

      await updateProject(newProjectId, { shopify_cart_id: cart.cartId });

      return NextResponse.json({
        projectId: newProjectId,
        checkoutUrl: cart.checkoutUrl,
        total: cart.total,
      });
    } catch (error) {
      await updateProject(newProjectId, {
        status: "CHECKOUT_FAILED",
        last_error: error instanceof Error ? error.message : "Shopify checkout failed",
      }).catch(() => null);
      throw error;
    }
  } catch (error) {
    console.error("checkout error", { projectId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не успяхме да създадем checkout." },
      { status: 500 }
    );
  }
}
