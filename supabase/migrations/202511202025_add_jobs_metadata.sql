alter table if exists jobs
  add column if not exists metadata jsonb;
