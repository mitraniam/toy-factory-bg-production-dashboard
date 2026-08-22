export type IntegrationCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

function exists(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getIntegrationChecks(): IntegrationCheck[] {
  const shopifyReady =
    exists("SHOPIFY_STORE_DOMAIN") &&
    (exists("SHOPIFY_STOREFRONT_PRIVATE_TOKEN") || exists("SHOPIFY_STOREFRONT_ACCESS_TOKEN")) &&
    (exists("SHOPIFY_PRODUCT_HANDLE") || (exists("SHOPIFY_VARIANT_10CM") && exists("SHOPIFY_VARIANT_15CM") && exists("SHOPIFY_VARIANT_20CM"))) &&
    (exists("SHOPIFY_WEBHOOK_SECRET") || exists("SHOPIFY_APP_CLIENT_SECRET"));

  return [
    {
      name: "Supabase",
      ok: exists("SUPABASE_URL") && exists("SUPABASE_SERVICE_ROLE_KEY"),
      detail: "База за проекти и production статуси",
    },
    {
      name: "Meshy",
      ok: exists("MESHY_API_KEY"),
      detail: process.env.NEXT_PUBLIC_MOCK_AI === "true" ? "Ключ има, но AI е в mock режим" : "Реално AI генериране",
    },
    {
      name: "Shopify",
      ok: shopifyReady,
      detail: "Checkout, плащане и orders/paid webhook",
    },
    {
      name: "Admin",
      ok: exists("ADMIN_PASSWORD") && (process.env.ADMIN_SESSION_SECRET?.length || 0) >= 32,
      detail: "Защитен production dashboard",
    },
    {
      name: "Auto sync",
      ok: exists("CRON_SECRET"),
      detail: "Проверка на Meshy build/3MF задачите",
    },
  ];
}
