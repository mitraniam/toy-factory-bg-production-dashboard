export type ProjectStatus =
  | "CHECKOUT_CREATED"
  | "CHECKOUT_FAILED"
  | "PAID_BUILD_STARTING"
  | "3D_GENERATING"
  | "BUILD_FAILED"
  | "PRINT_FILE_GENERATING"
  | "PRINT_FILE_FAILED"
  | "READY_FOR_PRINT"
  | "PRINTING"
  | "PRINTED"
  | "PACKED"
  | "SHIPPED"
  | "CANCELLED";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "CHECKOUT_CREATED",
  "CHECKOUT_FAILED",
  "PAID_BUILD_STARTING",
  "3D_GENERATING",
  "BUILD_FAILED",
  "PRINT_FILE_GENERATING",
  "PRINT_FILE_FAILED",
  "READY_FOR_PRINT",
  "PRINTING",
  "PRINTED",
  "PACKED",
  "SHIPPED",
  "CANCELLED",
];

export type ToyProject = {
  id: string;
  created_at?: string;
  updated_at?: string;
  prototype_task_id: string;
  preview_url: string;
  size_cm: number;
  price_eur: number;
  status: ProjectStatus;
  shopify_cart_id?: string | null;
  shopify_order_id?: string | null;
  shopify_order_name?: string | null;
  shopify_webhook_id?: string | null;
  paid_at?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  shipping_city?: string | null;
  build_task_id?: string | null;
  print_task_id?: string | null;
  glb_url?: string | null;
  three_mf_url?: string | null;
  production_notes?: string | null;
  tracking_number?: string | null;
  last_error?: string | null;
};

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing on the server.");
  }
  return { url, key };
}

async function supabaseRest(path: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body?.message || body?.details || body?.hint || `Supabase request failed with ${response.status}`;
    throw new Error(String(message));
  }
  return body;
}

export async function createProject(project: ToyProject) {
  const rows = (await supabaseRest("toy_projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(project),
  })) as ToyProject[];
  if (!rows?.[0]) throw new Error("Supabase did not return the created project.");
  return rows[0];
}

export async function updateProject(id: string, patch: Partial<ToyProject>) {
  const rows = (await supabaseRest(`toy_projects?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  })) as ToyProject[];
  return rows?.[0] || null;
}

export async function getProject(id: string) {
  const rows = (await supabaseRest(`toy_projects?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "GET",
  })) as ToyProject[];
  return rows?.[0] || null;
}

export async function listProjects(input: { status?: ProjectStatus; q?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc");
  params.set("limit", String(Math.min(Math.max(input.limit || 100, 1), 250)));
  if (input.status) params.set("status", `eq.${input.status}`);
  if (input.q?.trim()) {
    const q = input.q.trim().replace(/[,*()]/g, "");
    const filters = [
      `shopify_order_name.ilike.*${q}*`,
      `customer_name.ilike.*${q}*`,
      `customer_email.ilike.*${q}*`,
    ];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q)) {
      filters.push(`id.eq.${q}`);
    }
    params.set("or", `(${filters.join(",")})`);
  }
  return (await supabaseRest(`toy_projects?${params.toString()}`, { method: "GET" })) as ToyProject[];
}

export async function listProjectsByStatuses(statuses: ProjectStatus[], limit = 50) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("status", `in.(${statuses.join(",")})`);
  params.set("order", "created_at.asc");
  params.set("limit", String(limit));
  return (await supabaseRest(`toy_projects?${params.toString()}`, { method: "GET" })) as ToyProject[];
}

export async function claimProjectForPaidOrder(
  id: string,
  patch: Pick<
    ToyProject,
    | "shopify_order_id"
    | "shopify_order_name"
    | "shopify_webhook_id"
    | "paid_at"
    | "customer_name"
    | "customer_email"
    | "shipping_city"
  >
) {
  const path = `toy_projects?id=eq.${encodeURIComponent(id)}&status=eq.CHECKOUT_CREATED`;
  const rows = (await supabaseRest(path, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...patch,
      status: "PAID_BUILD_STARTING",
      updated_at: new Date().toISOString(),
    }),
  })) as ToyProject[];
  return rows?.[0] || null;
}
