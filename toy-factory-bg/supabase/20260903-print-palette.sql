-- Filament palette extracted from the Bambu 3MF (hex per AMS slot), shown in the dashboard.
alter table public.toy_projects add column if not exists print_palette jsonb;
