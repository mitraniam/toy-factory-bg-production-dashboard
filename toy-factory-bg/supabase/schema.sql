-- Run this in the SQL editor of the NEW Toy Factory Supabase project.
-- Safe to re-run: creates the table when missing and adds new dashboard columns when upgrading.

create extension if not exists pgcrypto;

create table if not exists public.toy_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  prototype_task_id text not null,
  preview_url text not null,
  size_cm integer not null check (size_cm in (10, 15, 20)),
  price_eur numeric(10,2) not null check (price_eur >= 0),

  status text not null default 'CHECKOUT_CREATED',

  shopify_cart_id text,
  shopify_order_id text,
  shopify_order_name text,
  shopify_webhook_id text,
  paid_at timestamptz,

  customer_name text,
  customer_email text,
  shipping_city text,

  build_task_id text,
  resize_task_id text,
  print_task_id text,
  glb_url text,
  three_mf_url text,

  production_notes text,
  tracking_number text,
  last_error text
);

-- Upgrade columns for an existing MVP database.
alter table public.toy_projects add column if not exists customer_name text;
alter table public.toy_projects add column if not exists customer_email text;
alter table public.toy_projects add column if not exists shipping_city text;
alter table public.toy_projects add column if not exists resize_task_id text;
alter table public.toy_projects add column if not exists print_task_id text;
alter table public.toy_projects add column if not exists production_notes text;
alter table public.toy_projects add column if not exists tracking_number text;

-- Replace the old status constraint if it exists.
alter table public.toy_projects drop constraint if exists toy_projects_status_check;
alter table public.toy_projects add constraint toy_projects_status_check check (
  status in (
    'CHECKOUT_CREATED',
    'CHECKOUT_FAILED',
    'PAID_BUILD_STARTING',
    '3D_GENERATING',
    'BUILD_FAILED',
    'MODEL_RESIZING',
    'PRINT_FILE_GENERATING',
    'PRINT_FILE_FAILED',
    'READY_FOR_PRINT',
    'PRINTING',
    'PRINTED',
    'PACKED',
    'SHIPPED',
    'CANCELLED'
  )
);

create index if not exists toy_projects_status_idx
  on public.toy_projects (status, created_at desc);

create index if not exists toy_projects_shopify_order_idx
  on public.toy_projects (shopify_order_id);

alter table public.toy_projects enable row level security;

comment on table public.toy_projects is
  'Internal production state for custom 3D figure orders. Server-side service-role access only.';
