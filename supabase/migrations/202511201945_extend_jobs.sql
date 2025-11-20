alter table if exists jobs
  add column if not exists variant text,
  add column if not exists error text,
  add column if not exists completed_at timestamp with time zone;
