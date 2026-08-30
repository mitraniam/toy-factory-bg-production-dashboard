-- POPME production hardening migration — 2026-08-30
-- Safe to re-run in the Supabase SQL Editor before deploying the matching app code.

alter table public.toy_projects drop constraint if exists toy_projects_status_check;
alter table public.toy_projects add constraint toy_projects_status_check check (
  status in (
    'CHECKOUT_CREATED',
    'CHECKOUT_FAILED',
    'PAID_BUILD_STARTING',
    'BUILD_SUBMITTING',
    '3D_GENERATING',
    'BUILD_FAILED',
    'MODEL_RESIZE_SUBMITTING',
    'MODEL_RESIZING',
    'PRINT_FILE_SUBMITTING',
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

create table if not exists public.api_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

alter table public.api_rate_limits enable row level security;

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_window_seconds integer,
  p_limit integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.api_rate_limits%rowtype;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.api_rate_limits(scope, key_hash, window_start, request_count, updated_at)
  values (p_scope, p_key_hash, v_now, 1, v_now)
  on conflict (scope, key_hash) do update
  set
    window_start = case
      when public.api_rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now then v_now
      else public.api_rate_limits.window_start
    end,
    request_count = case
      when public.api_rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now then 1
      else public.api_rate_limits.request_count + 1
    end,
    updated_at = v_now
  returning * into v_row;

  allowed := v_row.request_count <= p_limit;
  remaining := greatest(p_limit - v_row.request_count, 0);
  reset_at := v_row.window_start + make_interval(secs => p_window_seconds);
  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
