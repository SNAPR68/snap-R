-- Enable pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Create users table if it doesn't exist
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  credits integer default 20,
  has_onboarded boolean default false,
  created_at timestamp with time zone default now()
);

-- Add has_onboarded column if table exists but column doesn't
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'users') then
    if not exists (
      select 1 from information_schema.columns 
      where table_name = 'users' and column_name = 'has_onboarded'
    ) then
      alter table users add column has_onboarded boolean default false;
    end if;
  end if;
end $$;
