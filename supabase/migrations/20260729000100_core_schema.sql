-- ===========================================================================
-- Vedic Astrologey, core schema
--
-- Covers identity, saved birth data, the commerce tables (services, regions,
-- per-region prices), the blog, testimonials, enquiries and site settings.
--
-- Row level security is enabled on every table here, with policies applied in
-- the following migration. Nothing is readable by default.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('user', 'admin');
create type post_status as enum ('draft', 'scheduled', 'published');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type enquiry_status as enum ('new', 'contacted', 'scheduled', 'completed', 'closed');
create type order_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- A profile row is created for every new auth user, so application code can
-- always assume one exists rather than defensively upserting on each request.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

/*
  Admin check used by every policy below.

  SECURITY DEFINER matters here: the function reads `profiles`, and if a policy
  on `profiles` called a function that was itself subject to that policy, the
  result would be infinite recursion. Running as the owner bypasses RLS and
  breaks the cycle.

  `search_path` is pinned so the function cannot be redirected at call time.
*/
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Saved birth data
--
-- Only the raw birth details are stored. Charts are always recomputed from
-- them, so a correction to the engine improves every saved chart rather than
-- leaving stale results behind.
-- ---------------------------------------------------------------------------

create table birth_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  person_name text,
  birth_date date not null,
  birth_time time,
  time_unknown boolean not null default false,
  timezone text not null,
  place_name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  gender text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A known birth time must actually be present.
  constraint birth_time_present check (time_unknown or birth_time is not null)
);

create index birth_profiles_user_idx on birth_profiles (user_id, created_at desc);

create trigger birth_profiles_updated_at
  before update on birth_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Regions and pricing
--
-- Regions are data, not code. New countries and currencies are added from the
-- admin panel; nothing here needs redeploying to support them.
-- ---------------------------------------------------------------------------

create table regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  currency char(3) not null,
  symbol text not null,
  -- ISO 3166-1 alpha-2 codes belonging to this region.
  country_codes text[] not null default '{}',
  -- The fallback when a visitor's country matches no region.
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly one region may be the default, enforced by the database rather than
-- by application code that could be bypassed.
create unique index regions_single_default_idx
  on regions ((true)) where is_default;

create trigger regions_updated_at
  before update on regions
  for each row execute function set_updated_at();

create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  duration_minutes integer,
  deliverables text[] not null default '{}',
  cover_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_active_idx on services (is_active, sort_order);

create trigger services_updated_at
  before update on services
  for each row execute function set_updated_at();

create table service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  region_id uuid not null references regions (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  -- Optional "was" price, shown struck through.
  compare_at numeric(12, 2) check (compare_at is null or compare_at >= amount),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One price per service per region; duplicates would be ambiguous.
  unique (service_id, region_id)
);

create trigger service_prices_updated_at
  before update on service_prices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  -- Tiptap document, kept as JSON so the editor round-trips losslessly.
  content jsonb,
  -- Rendered HTML, so reading a post never requires running the editor.
  content_html text,
  cover_url text,
  category_id uuid references categories (id) on delete set null,
  status post_status not null default 'draft',
  published_at timestamptz,
  reading_minutes integer,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A published post must have a publication date, or ordering breaks.
  constraint published_has_date
    check (status <> 'published' or published_at is not null)
);

create index posts_published_idx
  on posts (status, published_at desc) where status = 'published';

create trigger posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

create table post_tags (
  post_id uuid not null references posts (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Social proof and enquiries
-- ---------------------------------------------------------------------------

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_location text,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  service_id uuid references services (id) on delete set null,
  status moderation_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_approved_idx
  on testimonials (status, created_at desc) where status = 'approved';

create trigger testimonials_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  -- Birth details supplied with the enquiry, if any.
  birth_details jsonb,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on enquiries (status, created_at desc);

create trigger enquiries_updated_at
  before update on enquiries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
--
-- Created now and left unused. Payments arrive later, and having the table in
-- place means that change is purely additive rather than a migration of live
-- enquiry data.
-- ---------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  region_id uuid references regions (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null,
  status order_status not null default 'pending',
  provider text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Site settings and newsletter
-- ---------------------------------------------------------------------------

create table site_settings (
  -- Enforces a single row: the primary key can only ever be true.
  id boolean primary key default true check (id),
  instagram_handle text,
  whatsapp_number text,
  contact_email text,
  hero_heading text,
  hero_subheading text,
  announcement_text text,
  announcement_active boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Enable row level security everywhere.
-- Policies are added in the next migration; until then nothing is readable.
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table birth_profiles enable row level security;
alter table regions enable row level security;
alter table services enable row level security;
alter table service_prices enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table posts enable row level security;
alter table post_tags enable row level security;
alter table testimonials enable row level security;
alter table enquiries enable row level security;
alter table orders enable row level security;
alter table site_settings enable row level security;
alter table newsletter_subscribers enable row level security;
