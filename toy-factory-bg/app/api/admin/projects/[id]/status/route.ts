import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getProject, ProjectStatus, updateProject } from "@/lib/projects";
import { MANUAL_PRODUCTION_STATUSES } from "@/lib/status";
import { createShopifyFulfillment, shopifyAdminConfigured } from "@/lib/shopify-admin";

const ALLOWED_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  READY_FOR_PRINT: ["READY_FOR_PRINT", "PRINTING", "CANCELLED"],
  PRINTING: ["PRINTING", "PRINTED", "CANCELLED"],
  PRINTED: ["PRINTED", "PACKED", "CANCELLED"],
  PACKED: ["PACKED", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED"],
  CANCELLED: ["CANCELLED"],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status || "") as ProjectStatus;

    if (!MANUAL_PRODUCTION_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid production status" }, { status: 400 });
    }

    const current = await getProject(id);
    if (!current) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const allowed = ALLOWED_TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${current.status} → ${status}` },
        { status: 409 }
      );
    }

    const trackingNumber = String(body?.trackingNumber || "").trim().slice(0, 250) || null;
    const trackingCompany = String(body?.trackingCompany || "").trim().slice(0, 100) || null;

    let project = await updateProject(id, {
      status,
      production_notes: String(body?.productionNotes || "").slice(0, 5000) || null,
      tracking_number: trackingNumber,
      tracking_company: trackingCompany,
      last_error: null,
    });

    // Shipping: tell Shopify so the customer gets the tracking email.
    // Never blocks the status save — a Shopify failure is surfaced as last_error.
    let fulfillment: { created: boolean; note: string } | null = null;
    if (status === "SHIPPED" && project && !project.shopify_fulfillment_id) {
      if (!project.shopify_order_id) {
        fulfillment = { created: false, note: "Проектът няма Shopify поръчка — няма какво да се fulfill-не." };
      } else if (!trackingNumber) {
        fulfillment = { created: false, note: "Няма tracking номер — Shopify fulfillment не е създаден. Добави номера и запази отново." };
      } else if (!shopifyAdminConfigured()) {
        fulfillment = { created: false, note: "SHOPIFY_ADMIN_ACCESS_TOKEN не е зададен — клиентът НЕ е уведомен от Shopify. Маркирай поръчката ръчно в Shopify." };
      } else {
        try {
          const fulfillmentId = await createShopifyFulfillment({
            orderId: project.shopify_order_id,
            trackingNumber,
            trackingCompany,
            notifyCustomer: true,
          });
          project = (await updateProject(id, { shopify_fulfillment_id: fulfillmentId })) || project;
          fulfillment = { created: true, note: "Shopify fulfillment е създаден; клиентът получава имейл с tracking." };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Shopify fulfillment failed";
          project = (await updateProject(id, { last_error: `Shopify fulfillment: ${message}` })) || project;
          fulfillment = { created: false, note: message };
        }
      }
    }

    return NextResponse.json({ ok: true, project, fulfillment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
