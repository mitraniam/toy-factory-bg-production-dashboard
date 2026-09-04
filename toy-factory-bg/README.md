# Toy Factory BG — end-to-end MVP + Production Dashboard

Standalone custom 3D figure business. This project is intentionally isolated from any other Shopify business.

## What is implemented

Customer flow:

1. Upload photo.
2. Meshy Vinyl Figure prototype generates the low-cost visual preview.
3. Customer approves and chooses 10 / 15 / 20 cm.
4. Server verifies the Meshy prototype.
5. Supabase creates a private `toy_projects` record.
6. Shopify Storefront API creates a cart and returns the hosted checkout URL.
7. Customer pays in Shopify Checkout.
8. Shopify `Order payment` / `orders/paid` webhook reaches our server and its HMAC is verified.
9. Only after payment, Meshy Vinyl Figure Build creates the GLB 3D model.
10. Auto-sync detects the successful GLB and starts Meshy Multi-Color Print in `cartoon` mode.
11. When 3MF is ready, status changes to `READY_FOR_PRINT`.
12. Internal dashboard manages PRINTING → PRINTED → PACKED → SHIPPED.

Admin dashboard:

- `/admin` password login with HttpOnly signed session cookie.
- `/admin/dashboard` order list, filters and integration health.
- project details with approved preview, Shopify/customer data, GLB and 3MF links.
- manual Meshy status check.
- retry failed 3D build or 3MF generation.
- production notes and tracking number.
- production status controls.
- Vercel Cron auto-sync every 5 minutes.

## STEP 1 — Create a NEW Shopify store

Do not connect credentials from another business.

Create a new Shopify store and select EUR as the store currency.

### Create the product

Products → Add product

Temporary title:

`Персонализирана 3D фигурка`

Create one option (the option name can be `Размер` or `Size`) with these exact values:

- `10 cm` — €49
- `15 cm` — €69
- `20 cm` — €89

Recommended settings:

- physical product / requires shipping: YES
- inventory tracking: OFF for now (made to order)
- status: Active

After saving, open the product and look at its URL. The part after `/products/` is its handle. Example:

`https://YOURSTORE.myshopify.com/products/personalizirana-3d-figurka`

Then:

`SHOPIFY_PRODUCT_HANDLE=personalizirana-3d-figurka`

You do NOT need the GraphQL variant IDs when the handle is configured. The backend resolves the 10/15/20 cm variant automatically.

## STEP 2 — Enable Shopify Headless / Storefront API

In Shopify:

1. Install/add the **Headless** sales channel.
2. Open Headless.
3. Click **Create storefront** / **Add storefront**.
4. Give it a temporary name such as `Toy Factory Web`.
5. Copy its **private Storefront API access token**.
6. Make sure the custom product is published/available to the Headless sales channel.

Set:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_API_VERSION=2026-07
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=...
SHOPIFY_PRODUCT_HANDLE=personalizirana-3d-figurka
```

Private Storefront tokens stay server-side. Never put them in `NEXT_PUBLIC_*` variables.

## STEP 3 — Create the Supabase production database

Create a completely new Supabase project.

Then:

1. Open **SQL Editor**.
2. Create a new query.
3. Paste the complete contents of `supabase/schema.sql`.
4. Run it.
5. Confirm that `public.toy_projects` exists in Table Editor.

Get the server credentials and set:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
```

Use the server/service-role credential, never an anon/public key. It must never be exposed to the browser.

## STEP 4 — Create a Meshy API key

Create an API key in Meshy and set:

```env
MESHY_API_KEY=...
MESHY_PRINT_MAX_COLORS=8
```

For UI-only development:

```env
NEXT_PUBLIC_MOCK_AI=true
```

For the real end-to-end test:

```env
NEXT_PUBLIC_MOCK_AI=false
```

The real test spends Meshy credits because it runs prototype → build → multi-color 3MF.

## STEP 5 — Create admin security secrets

Choose a strong dashboard password:

```env
ADMIN_PASSWORD=YOUR_PRIVATE_ADMIN_PASSWORD
```

Generate two different random strings of at least 32 characters for:

```env
ADMIN_SESSION_SECRET=...
CRON_SECRET=...
```

Do not reuse your Shopify, Meshy or Supabase passwords.

## STEP 6 — Put the project in GitHub

Unzip the project, then in the project directory:

```bash
npm install
npm run dev
```

For deployment, create a private GitHub repository and push the project to it.

The repository must contain `vercel.json` at the root.

## STEP 7 — Deploy to Vercel

1. In Vercel click **Add New → Project**.
2. Import the GitHub repository.
3. Framework should be detected as Next.js.
4. Add all Environment Variables from `.env.example`.
5. Deploy.
6. After any environment-variable change, redeploy.

Use Vercel Pro for the included 5-minute Cron schedule. Hobby plans can restrict cron frequency; if you temporarily use Hobby, remove `vercel.json` and use the manual **Sync Meshy now** button in the dashboard during testing.

After deploy you will have a URL such as:

`https://YOUR-PROJECT.vercel.app`

Check:

`https://YOUR-PROJECT.vercel.app/admin`

Log in with `ADMIN_PASSWORD`. The dashboard integration pills should become green as the environment variables are filled in.

## STEP 8 — Create Shopify Order payment webhook

Do this only after Vercel is deployed because Shopify needs a public HTTPS URL.

Shopify Admin:

1. **Settings → Notifications**.
2. Open **Webhooks**.
3. Click **Create webhook**.
4. Event: **Order payment**.
5. Format: **JSON**.
6. URL:

```text
https://YOUR-PROJECT.vercel.app/api/shopify/webhooks/orders-paid
```

7. Webhook API version: `2026-07` (or the current compatible stable version).
8. Save.
9. In the Webhooks section copy the store's webhook signing secret (the value Shopify uses to sign webhooks).
10. In Vercel set:

```env
SHOPIFY_WEBHOOK_SECRET=...
```

11. Redeploy Vercel after saving the variable.

The code verifies `X-Shopify-Hmac-SHA256` using the raw request body before trusting the order payload.

12. Create two more webhooks with the same signing secret, both pointing to:

```text
https://YOUR-PROJECT.vercel.app/api/shopify/webhooks/orders-cancelled
```

- Event **Order cancellation** (`orders/cancelled`) — a project that has not started printing is set to `CANCELLED`; a project already in production is flagged in the dashboard for a manual decision.
- Event **Refund create** (`refunds/create`) — never auto-cancels, only flags the project so the operator checks the order before continuing.

## STEP 9 — Test the webhook endpoint itself

In Shopify Settings → Notifications → Webhooks:

1. Find the Order payment webhook.
2. `...` → **Send test**.
3. The endpoint should return 2xx rather than 401/500.

A Shopify sample webhook normally won't contain one of our real `Project ID` line-item attributes, so this test is only verifying delivery + HMAC. It does not start a 3D build.

If you get `401 Invalid webhook signature`, check `SHOPIFY_WEBHOOK_SECRET` and redeploy.

## STEP 10 — Enable a Shopify test payment gateway

A Shopify store must be on a paid plan to use test payment gateways.

Recommended options:

- Shopify Payments test mode, or
- Shopify's `(for testing) Bogus Gateway`.

With Bogus Gateway, Shopify documents these values for a successful test:

- Name on card: `Bogus Gateway`
- Card number: `1`
- CVV: any 3 digits, e.g. `111`
- Expiry: any future date

Do not leave a payment provider in test mode once the store is opened to customers.

## STEP 11 — REAL END-TO-END TEST

Before starting, verify in Vercel:

```env
NEXT_PUBLIC_MOCK_AI=false
```

Then:

1. Open your Vercel storefront home page.
2. Upload a clear photo.
3. Generate the Vinyl preview.
4. Approve it.
5. Choose **10 cm** for the cheapest physical test.
6. Click **Продължи към плащане**.
7. Confirm Shopify Checkout opens and price is €49.
8. Complete the test payment.
9. Open `/admin/dashboard`.
10. A new row should contain the Shopify order and status `3D generating`.
11. Click the project.
12. Press **Check Meshy status** as needed, or let the 5-minute cron sync it.
13. Expected progression:

```text
3D_GENERATING
→ PRINT_FILE_GENERATING
→ READY_FOR_PRINT
```

14. On `READY_FOR_PRINT`, the project page should show:
    - approved preview
    - `Open GLB`
    - `Download 3MF`
15. Download the 3MF and send it to the outsourced printer.
16. Update status:

```text
READY_FOR_PRINT
→ PRINTING
→ PRINTED
→ PACKED
→ SHIPPED
```

## STEP 12 — What to check after the first test

Shopify:

- paid order exists
- correct €49/€69/€89 variant
- Project ID appears as line-item property
- customer/shipping details are correct

Supabase:

- one `toy_projects` row
- `shopify_order_name` populated
- `paid_at` populated
- `build_task_id` populated
- later `print_task_id`, `glb_url`, `three_mf_url` populated

Meshy:

- prototype succeeded
- build succeeded
- multi-color print succeeded

Dashboard:

- correct preview
- correct size
- correct status
- GLB link works
- 3MF link works
- manual statuses save

Physical production:

- 3MF opens in the printer's slicer
- colors map acceptably to the printer's available filament/nozzles
- scale is correct for 10 cm
- thin parts are printable
- base/support works

## Security already implemented

- Meshy key is server-only.
- Shopify private Storefront token is server-only.
- Supabase service-role credential is server-only.
- Admin dashboard uses a signed HttpOnly cookie.
- Webhook HMAC is verified before parsing/trusting the order.
- Browser cannot request a paid Meshy Build directly.
- Project ID connects commerce to production without exposing Meshy credentials.
- Duplicate paid webhook delivery can't start duplicate builds.
- Failed production jobs are recoverable from the dashboard.

## Important MVP limitation

Meshy output links can be time-limited. The dashboard can refresh them by querying the Meshy task again, but the next production hardening step should copy final GLB/3MF files into our own private object storage (for example Supabase Storage or R2) so every production file is archived permanently.

## STEP 13 — Shipping notifications + operator alerts (Phase 2)

### 13.1 Run the migration

In Supabase SQL editor run `supabase/20260903-alerts-fulfillment.sql` (adds
`alert_sent_at`, `shopify_fulfillment_id`, `tracking_company`).

### 13.2 Shopify Admin API token (customer tracking email)

1. Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app (e.g. `POPME production`).
2. Configure Admin API scopes: `read_orders`, `write_fulfillments` (also `read_fulfillments`, `read_merchant_managed_fulfillment_orders`, `write_merchant_managed_fulfillment_orders`).
3. Install the app and copy the Admin API access token (`shpat_…`) into Vercel as `SHOPIFY_ADMIN_ACCESS_TOKEN`.
4. Redeploy.

From then on, saving a project as **Shipped** with a tracking number (and optionally a courier name) creates the fulfillment in Shopify and Shopify emails the customer the tracking link. The fulfillment id is stored on the project; the dashboard shows the outcome under the form. If the token is missing, the status still saves and the dashboard tells you to mark the order in Shopify by hand.

### 13.3 Alerts (Resend)

1. In Resend create an API key and, ideally, verify your sending domain.
2. In Vercel set `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` (see `.env.example`).
3. Redeploy.

The watchdog runs after every cron sync and after the dashboard's "Sync Meshy now". It emails you once per problem when:

- a project has any `last_error` (3D failed, 3MF failed, quantity mismatch, cancellation during production, refund, Shopify fulfillment error);
- a project sits in an automated stage (`3D generating`, `Sizing model`, `Preparing 3MF`, …) longer than `WATCHDOG_STALE_MINUTES` (default 120).

An alert is sent once and stamped in `alert_sent_at`; clearing the error (Retry, saving a manual status) re-arms it.

## STEP 14 — Opening the 3MF in Bambu Studio (colours)

Run `supabase/20260903-print-palette.sql` once (adds `print_palette`).

The archived 3MF is a Bambu Studio project: geometry with per-triangle filament
painting plus 8 filament slots with their colours. Always open it with
**File → Open Project** (not Import / drag-and-drop as geometry).

If the whole model shows in one colour and only one filament is listed, Bambu
Studio discarded the file's project config: Meshy writes no `printer_model` /
`nozzle_diameter`, so Bambu loads geometry only.

Fix: set `BAMBU_PRINTER_MODEL` in Vercel (plus `BAMBU_PROFILE_CODE` and
`BAMBU_NOZZLE_DIAMETER` if the derived values are wrong — see `.env.example`)
and regenerate the 3MF. The post-processor then writes your printer's system
preset names into `project_settings.config` and the file opens with every
filament slot and the painted colours.

For a file generated before this was configured, set the slot colours by hand
from the palette shown on the project page in the dashboard.

Note: Meshy's raw 3MF is ~100 MB; post-processing needs up to ~1 GB RAM and
10–20 s. Vercel functions on the Pro plan (1.7 GB default) handle it; on Hobby
(1 GB) it may run out of memory — the project then lands in `PRINT_FILE_FAILED`
with the raw Meshy 3MF link still available for manual scaling.
