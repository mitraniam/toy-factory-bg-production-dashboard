-- Data retention: marks projects whose generated files have been deleted.
alter table public.toy_projects add column if not exists assets_purged_at timestamptz;

create index if not exists toy_projects_retention_idx
  on public.toy_projects (status, updated_at)
  where assets_purged_at is null;
