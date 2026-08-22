import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createBuild } from "@/lib/meshy";
import {
  claimProjectForPaidOrder,
  updateProject,
} from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShopifyProperty = { name?: string; value?: string };
type ShopifyLineItem = { properties?: ShopifyProperty[] };
type ShopifyPaidOrder = {
  id?: number | string;
  admin_graphql_api_id?: string;
  name?: string;
  processed_at?: string;
  email?: string;
  contact_email?: string;
  customer?: { first_name?: string; last_name?: string; email?: string } | null;
  shipping_address?: { first_name?: string; last_name?: string; city?: string } | null;
  line_items?: ShopifyLineItem[];
};

function verifyWebhook(rawBody: string, providedHmac: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_APP_CLIENT_SECRET;
  if (!secret || !providedHmac) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const providedBuffer = Buffer.from(providedHmac, "utf8");
  const computedBuffer = Buffer.from(computed, "utf8");
  if (providedBuffer.length !== computedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, computedBuffer);
}

function projectIdsFromOrder(order: ShopifyPaidOrder) {
  const ids = new Set<string>();
  for (const line of order.line_items || []) {
    for (const property of line.properties || []) {
      if (property.name === "Project ID" && property.value) {
        ids.add(property.value);
      }
    }
  }
  return [...ids];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const webhookId = request.headers.get("x-shopify-webhook-id");

  if (!verifyWebhook(rawBody, hmac)) {
    return new NextResponse("Invalid webhook signature", { status: 401 });
  }

  if (topic && topic !== "orders/paid") {
    return new NextResponse("Ignored topic", { status: 200 });
  }

  let order: ShopifyPaidOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyPaidOrder;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const projectIds = projectIdsFromOrder(order);
  if (!projectIds.length) {
    // A paid Shopify order unrelated to our custom-figure product.
    return new NextResponse("No toy projects", { status: 200 });
  }

  const orderId =
    order.admin_graphql_api_id ||
    (order.id ? `gid://shopify/Order/${String(order.id)}` : null);

  if (!orderId) {
    return new NextResponse("Missing order id", { status: 400 });
  }

  const failures: string[] = [];

  for (const projectId of projectIds) {
    try {
      const claimed = await claimProjectForPaidOrder(projectId, {
        shopify_order_id: orderId,
        shopify_order_name: order.name || null,
        shopify_webhook_id: webhookId || null,
        paid_at: order.processed_at || new Date().toISOString(),
        customer_name:
          [order.shipping_address?.first_name || order.customer?.first_name, order.shipping_address?.last_name || order.customer?.last_name]
            .filter(Boolean)
            .join(" ") || null,
        customer_email: order.contact_email || order.email || order.customer?.email || null,
        shipping_city: order.shipping_address?.city || null,
      });

      // Duplicate webhook or a project already being/been processed.
      if (!claimed) continue;

      try {
        const buildTaskId = await createBuild(claimed.prototype_task_id);
        await updateProject(projectId, {
          status: "3D_GENERATING",
          build_task_id: buildTaskId,
          last_error: null,
        });
      } catch (buildError) {
        const message = buildError instanceof Error ? buildError.message : "Meshy build failed";
        await updateProject(projectId, {
          status: "BUILD_FAILED",
          last_error: message,
        });
        failures.push(`${projectId}: ${message}`);
      }
    } catch (error) {
      failures.push(
        `${projectId}: ${error instanceof Error ? error.message : "Unknown processing error"}`
      );
    }
  }

  // Once the paid order is safely recorded in Supabase, build failures are recovered
  // from the production dashboard. Returning 2xx avoids pointless Shopify retries.
  if (failures.length) console.error("orders/paid processing failures", failures);
  return new NextResponse(failures.length ? "Recorded with production errors" : "OK", { status: 200 });
}
