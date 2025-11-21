-- USERS
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  credits integer default 20,
  has_onboarded boolean default false,
  created_at timestamp with time zone default now()
);

-- LISTINGS
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  address text,
  city text,
  state text,
  postal_code text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- JOBS (must be created before photos due to foreign key reference)
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  listing_id uuid,
  variant text,
  metadata jsonb,
  error text,
  completed_at timestamp with time zone,
  status text default 'queued',
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
  processed_at timestamp with time zone,
  variant text,
  error text,
  status text default 'pending',
  room_type text,
  quality_score numeric,
  created_at timestamp with time zone default now()
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

-- INDEXES for better query performance
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_created_at on jobs(created_at);
create index if not exists idx_photos_job_id on photos(job_id);
create index if not exists idx_photos_listing_id on photos(listing_id);
create index if not exists idx_photos_status on photos(status);
create index if not exists idx_photos_listing_status on photos(listing_id, status);
create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_created_at on listings(created_at);
create index if not exists idx_payments_user_id on payments(user_id);
