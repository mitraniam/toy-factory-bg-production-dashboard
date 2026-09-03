import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { syncProject } from "@/lib/production";
import { claimProjectForPaidOrder, updateProject } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShopifyProperty = { name?: string; value?: string };
type ShopifyLineItem = { quantity?: number; properties?: ShopifyProperty[] };
type ShopifyPaidOrder = {
  id?: number | string;
  admin_graphql_api_id?: string;
  name?: string;
  financial_status?: string;
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

function normalizeShopDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0].toLowerCase();
}

function shopDomainMatches(provided: string | null) {
  const expected = process.env.SHOPIFY_STORE_DOMAIN;
  // If the store domain is not configured we cannot verify it; HMAC still protects us.
  if (!expected) return true;
  if (!provided) return false;
  return normalizeShopDomain(provided) === normalizeShopDomain(expected);
}

const PAID_FINANCIAL_STATUSES = new Set(["paid", "partially_refunded"]);

/** Project IDs with the total ordered quantity per project. */
function projectQuantitiesFromOrder(order: ShopifyPaidOrder) {
  const quantities = new Map<string, number>();
  for (const line of order.line_items || []) {
    const quantity = Number.isFinite(line.quantity) ? Number(line.quantity) : 1;
    for (const property of line.properties || []) {
      if (property.name === "Project ID" && property.value) {
        quantities.set(property.value, (quantities.get(property.value) || 0) + quantity);
      }
    }
  }
  return quantities;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  if (!verifyWebhook(rawBody, hmac)) return new NextResponse("Invalid webhook signature", { status: 401 });
  if (!shopDomainMatches(shopDomain)) return new NextResponse("Unknown shop domain", { status: 401 });
  if (topic && topic !== "orders/paid") return new NextResponse("Ignored topic", { status: 200 });

  let order: ShopifyPaidOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyPaidOrder;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // orders/paid should only fire for paid orders, but never trust the topic alone.
  if (order.financial_status && !PAID_FINANCIAL_STATUSES.has(order.financial_status)) {
    console.warn("orders/paid webhook with non-paid financial_status", {
      order: order.name || order.id || null,
      financialStatus: order.financial_status,
    });
    return new NextResponse("Order is not paid", { status: 200 });
  }

  const projectQuantities = projectQuantitiesFromOrder(order);
  const projectIds = [...projectQuantities.keys()];
  if (!projectIds.length) return new NextResponse("No toy projects", { status: 200 });

  const orderId = order.admin_graphql_api_id || (order.id ? `gid://shopify/Order/${String(order.id)}` : null);
  if (!orderId) return new NextResponse("Missing order id", { status: 400 });

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

      // Duplicate webhook deliveries are expected. A project already claimed
      // by the first delivery is intentionally treated as successfully handled.
      if (!claimed) continue;

      // The customer can change the line quantity inside Shopify Checkout, but
      // one project produces exactly one figure. Park it as BUILD_FAILED so the
      // cron never auto-builds it; the operator resolves it and presses Retry.
      const quantity = projectQuantities.get(projectId) || 1;
      if (quantity !== 1) {
        console.error("orders/paid quantity mismatch", { projectId, order: order.name || orderId, quantity });
        await updateProject(projectId, {
          status: "BUILD_FAILED",
          last_error: `Поръчано количество ${quantity} за един проект. Ръчна обработка: свържи се с клиента преди да стартираш 3D build (Retry).`,
        });
        continue;
      }

      try {
        await syncProject(claimed);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Production sync failed";
        failures.push(`${projectId}: ${message}`);
      }
    } catch (error) {
      failures.push(`${projectId}: ${error instanceof Error ? error.message : "Unknown processing error"}`);
    }
  }

  if (failures.length) {
    console.error("orders/paid processing failures", failures);
    // Non-2xx is deliberate: Shopify should retry transient delivery/DB failures.
    // Idempotent project claims prevent the retry from launching duplicate work.
    return new NextResponse("Temporary processing failure", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
