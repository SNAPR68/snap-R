alter table if exists listings
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists description text;

alter table if exists photos
  add column if not exists processed_at timestamp with time zone,
  add column if not exists variant text,
  add column if not exists error text;
