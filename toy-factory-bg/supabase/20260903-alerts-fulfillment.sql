-- Phase 2: operator alerts + Shopify fulfillment tracking.
-- Run in Supabase SQL editor (idempotent).

alter table public.toy_projects add column if not exists alert_sent_at timestamptz;
alter table public.toy_projects add column if not exists shopify_fulfillment_id text;
alter table public.toy_projects add column if not exists tracking_company text;

-- Watchdog queries filter on these.
create index if not exists toy_projects_alert_pending_idx
  on public.toy_projects (alert_sent_at)
  where alert_sent_at is null;
