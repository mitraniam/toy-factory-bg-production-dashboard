const SHOPIFY_API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-07";

const CART_CREATE_MUTATION = `#graphql
mutation CartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
      lines(first: 10) {
        nodes {
          id
          quantity
          attributes { key value }
          merchandise {
            ... on ProductVariant { id title }
          }
        }
      }
    }
    userErrors { field message code }
    warnings { code target message }
  }
}`;

const PRODUCT_VARIANTS_QUERY = `#graphql
query ProductVariantsByHandle($handle: String!) {
  product(handle: $handle) {
    id
    title
    variants(first: 20) {
      nodes {
        id
        title
        availableForSale
        selectedOptions { name value }
      }
    }
  }
}`;

type StorefrontResponse<T> = { data?: T; errors?: Array<{ message: string }> };
export type ToySize = "10" | "15" | "20";

function normalizeShopDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
}

function getShopDomain() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is missing on the server.");
  return normalizeShopDomain(domain);
}

function getStorefrontAuthHeaders(): Record<string, string> {
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (privateToken) return { "Shopify-Storefront-Private-Token": privateToken };
  if (publicToken) return { "X-Shopify-Storefront-Access-Token": publicToken };
  throw new Error("Set SHOPIFY_STOREFRONT_PRIVATE_TOKEN (preferred) or SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
}

async function storefrontRequest<T>(query: string, variables: Record<string, unknown>, buyerIp?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...getStorefrontAuthHeaders() };
  if (buyerIp && process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  const response = await fetch(`https://${getShopDomain()}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as StorefrontResponse<T> | null;
  if (!response.ok) throw new Error(`Shopify Storefront API failed with HTTP ${response.status}.`);
  if (body?.errors?.length) throw new Error(body.errors.map((error) => error.message).join("; "));
  if (!body?.data) throw new Error("Shopify Storefront API returned no data.");
  return body.data;
}

function directVariantId(size: ToySize) {
  const value = process.env[`SHOPIFY_VARIANT_${size}CM`];
  if (!value) return null;
  if (!value.startsWith("gid://shopify/ProductVariant/")) throw new Error(`SHOPIFY_VARIANT_${size}CM must be a full ProductVariant GID.`);
  return value;
}

async function resolveVariantId(size: ToySize, buyerIp?: string | null) {
  const direct = directVariantId(size);
  if (direct) return direct;

  const handle = process.env.SHOPIFY_PRODUCT_HANDLE;
  if (!handle) throw new Error(`Set SHOPIFY_VARIANT_${size}CM or SHOPIFY_PRODUCT_HANDLE.`);

  const data = await storefrontRequest<{
    product?: {
      variants: { nodes: Array<{ id: string; title: string; availableForSale: boolean; selectedOptions: Array<{ name: string; value: string }> }> };
    } | null;
  }>(PRODUCT_VARIANTS_QUERY, { handle }, buyerIp);

  const product = data.product;
  if (!product) throw new Error(`Shopify product '${handle}' was not found or is not published to the Headless channel.`);
  const normalizedNeedle = `${size}cm`.replace(/\s/g, "").toLowerCase();
  const variant = product.variants.nodes.find((item) => {
    const values = [item.title, ...item.selectedOptions.map((option) => option.value)]
      .map((value) => value.replace(/\s/g, "").toLowerCase());
    return values.some((value) => value === normalizedNeedle || value.includes(normalizedNeedle));
  });
  if (!variant) throw new Error(`No Shopify variant matching '${size} cm' was found on product '${handle}'.`);
  if (!variant.availableForSale) throw new Error(`The '${size} cm' Shopify variant is not available for sale.`);
  return variant.id;
}

export async function createToyCheckout(input: { size: ToySize; projectId: string; buyerIp?: string | null }) {
  const merchandiseId = await resolveVariantId(input.size, input.buyerIp);
  const data = await storefrontRequest<{
    cartCreate?: {
      cart?: { id: string; checkoutUrl: string; totalQuantity: number; cost?: { totalAmount?: { amount: string; currencyCode: string } } } | null;
      userErrors?: Array<{ field?: string[] | null; message: string; code?: string | null }>;
      warnings?: Array<{ code?: string | null; target?: string | null; message: string }>;
    };
  }>(
    CART_CREATE_MUTATION,
    {
      input: {
        lines: [{ quantity: 1, merchandiseId, attributes: [{ key: "Project ID", value: input.projectId }] }],
        attributes: [{ key: "toy_project_id", value: input.projectId }],
      },
    },
    input.buyerIp
  );

  const result = data.cartCreate;
  if (result?.userErrors?.length) throw new Error(result.userErrors.map((error) => error.message).join("; "));
  if (!result?.cart?.id || !result.cart.checkoutUrl) throw new Error("Shopify did not return a cart and checkout URL.");
  return { cartId: result.cart.id, checkoutUrl: result.cart.checkoutUrl, totalQuantity: result.cart.totalQuantity, total: result.cart.cost?.totalAmount, warnings: result.warnings || [] };
}
