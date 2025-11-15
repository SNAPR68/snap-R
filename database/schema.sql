-- USERS
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  credits integer default 20,
  created_at timestamp with time zone default now()
);

-- LISTINGS
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- PHOTOS
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  job_id uuid references jobs(id),
  raw_url text,
  processed_url text,
  status text default 'pending',
  room_type text,
  quality_score numeric,
  created_at timestamp with time zone default now()
);

-- JOBS
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  listing_id uuid,
  status text default 'queued',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- FLOORPLANS
create table if not exists floorplans (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  source_url text,
  processed_url text,
  created_at timestamp with time zone default now()
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  amount numeric,
  credits integer,
  provider text,
  created_at timestamp with time zone default now()
);
