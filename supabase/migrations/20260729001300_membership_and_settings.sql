-- ===========================================================================
-- Membership groundwork: feature gating, plans, settings and notifications.
--
-- No payment gateway is wired yet. Everything here is shaped so that adding
-- Razorpay or Stripe later is additive: the provider columns exist and stay
-- null, and nothing else has to change when they start being filled.
-- ===========================================================================

create type feature_tier as enum ('free', 'account', 'premium');
create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'cancelled', 'expired'
);
create type notification_channel as enum ('email', 'whatsapp', 'sms');
create type notification_state as enum (
  'queued', 'sending', 'sent', 'failed', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- Feature flags
--
-- Which tier a capability needs is a decision that changes with the business,
-- not with the code. Keeping it in a table means moving a feature between free,
-- account-only and premium is a dropdown in the admin panel rather than a
-- deployment, and the decision is visible in one place instead of scattered
-- through conditionals.
-- ---------------------------------------------------------------------------

create table feature_flags (
  key text primary key,
  label text not null,
  description text,
  tier feature_tier not null default 'free',
  -- Separate from tier: a kill switch for something broken or not yet ready,
  -- which is a different decision from who is allowed to use it.
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger feature_flags_updated_at
  before update on feature_flags
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Plans and their per-region prices
--
-- Deliberately reusing the existing `regions` table rather than inventing a
-- second pricing scheme. A membership is priced by region exactly like a
-- consultation, so a region added for one is immediately available to the
-- other.
-- ---------------------------------------------------------------------------

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  summary text,
  benefits text[] not null default '{}',
  billing_interval text not null default 'month'
    check (billing_interval in ('month', 'year')),
  trial_days integer not null default 0 check (trial_days >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscription_plans_updated_at
  before update on subscription_plans
  for each row execute function set_updated_at();

create table plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references subscription_plans (id) on delete cascade,
  region_id uuid not null references regions (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  compare_at numeric(12, 2) check (compare_at is null or compare_at >= amount),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (plan_id, region_id)
);

create trigger plan_prices_updated_at
  before update on plan_prices
  for each row execute function set_updated_at();

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references subscription_plans (id) on delete set null,
  status subscription_status not null default 'trialing',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,

  -- Null until a gateway is wired. Kept as free text rather than an enum so
  -- adding a provider is data, not a schema change.
  provider text,
  provider_subscription_id text,
  provider_customer_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- One live subscription per person. Without this a failed webhook retry could
-- leave somebody holding two, and every entitlement question would then depend
-- on which row was read first.
create unique index subscriptions_one_live_per_user
  on subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due');

create index subscriptions_expiry_idx
  on subscriptions (current_period_end)
  where status in ('trialing', 'active');

-- ---------------------------------------------------------------------------
-- Entitlement
-- ---------------------------------------------------------------------------

/*
  Whether the current user holds a live membership.

  SECURITY DEFINER for the same reason is_admin() is: this is called from
  policies, and a policy calling a function that is itself subject to a policy
  would recurse. Administrators always count as premium, so the site can be
  checked from the inside without anybody having to buy their own product.
*/
create or replace function public.has_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_admin()
    or exists (
      select 1
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status in ('trialing', 'active')
        and (s.current_period_end is null or s.current_period_end > now())
    );
$$;

revoke execute on function public.has_premium() from public, anon;
grant execute on function public.has_premium() to authenticated;

-- ---------------------------------------------------------------------------
-- User settings
--
-- What people actually want to change, and nothing more. Every value here has
-- a working default, so a person who never opens the settings page is not in a
-- half-configured state.
-- ---------------------------------------------------------------------------

create table user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,

  -- The South Indian geometry has been in the codebase since the first chart
  -- commit. This is the switch it was waiting for.
  chart_style text not null default 'north' check (chart_style in ('north', 'south')),

  ayanamsa text not null default 'lahiri',
  house_system text not null default 'whole_sign',
  node_type text not null default 'mean' check (node_type in ('mean', 'true')),

  language text not null default 'en' check (language in ('en', 'hi', 'bn')),
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),

  -- Their own timezone, so a daily reading arrives in their morning rather
  -- than in mine.
  timezone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications
--
-- Channel-agnostic by design. Email works through a provider now; WhatsApp and
-- SMS need business verification and a paid solution provider, so the queue
-- carries the channel and an adapter is plugged in when that exists. Nothing
-- above this layer changes when it does.
-- ---------------------------------------------------------------------------

create table notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,

  email_enabled boolean not null default true,
  whatsapp_enabled boolean not null default false,
  sms_enabled boolean not null default false,

  -- E.164, null until somebody gives one.
  phone text,
  -- Recorded separately from the toggle. Consent to be messaged on WhatsApp
  -- has to be demonstrable, and a boolean that was flipped at an unknown time
  -- demonstrates nothing.
  whatsapp_opt_in_at timestamptz,
  sms_opt_in_at timestamptz,

  daily_reading boolean not null default false,
  weekly_reading boolean not null default true,
  monthly_reading boolean not null default false,
  transit_alerts boolean not null default true,
  newsletter boolean not null default false,

  -- Local hour, 0 to 23, at which scheduled sends are aimed.
  send_hour smallint not null default 7 check (send_hour between 0 and 23),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function set_updated_at();

create table notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  channel notification_channel not null,

  -- The destination is captured when the message is queued rather than looked
  -- up when it is sent, so changing an address later cannot redirect a message
  -- that was already prepared for the old one.
  destination text not null,

  template text not null,
  payload jsonb not null default '{}',

  state notification_state not null default 'queued',
  scheduled_for timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,

  -- Idempotency. A retry, an overlapping cron run or a double click must not
  -- produce two messages, and the database is the only layer that can promise
  -- that.
  dedupe_key text,

  created_at timestamptz not null default now()
);

create unique index notification_queue_dedupe_idx
  on notification_queue (dedupe_key)
  where dedupe_key is not null;

create index notification_queue_due_idx
  on notification_queue (scheduled_for)
  where state = 'queued';

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table feature_flags enable row level security;
alter table subscription_plans enable row level security;
alter table plan_prices enable row level security;
alter table subscriptions enable row level security;
alter table user_settings enable row level security;
alter table notification_preferences enable row level security;
alter table notification_queue enable row level security;

-- Flags are readable by everyone, including signed-out visitors, because the
-- site has to know what to offer before it knows who is asking.
create policy feature_flags_public_read on feature_flags
  for select to anon, authenticated using (true);
create policy feature_flags_admin_all on feature_flags
  for all to authenticated using (is_admin()) with check (is_admin());

create policy subscription_plans_public_read on subscription_plans
  for select to anon, authenticated using (is_active);
create policy subscription_plans_admin_all on subscription_plans
  for all to authenticated using (is_admin()) with check (is_admin());

create policy plan_prices_public_read on plan_prices
  for select to anon, authenticated using (
    exists (select 1 from subscription_plans p where p.id = plan_id and p.is_active)
  );
create policy plan_prices_admin_all on plan_prices
  for all to authenticated using (is_admin()) with check (is_admin());

/*
  A subscription is readable by its owner and writable by nobody but an
  administrator or the service role.

  This is the difference between a paywall and a suggestion. If a person could
  update their own subscription row they would simply set status to 'active',
  so there is no self-write policy at all, and the update privilege is revoked
  outright rather than merely left unpoliced.
*/
revoke insert, update, delete on subscriptions from authenticated;

create policy subscriptions_select_own on subscriptions
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy subscriptions_admin_all on subscriptions
  for all to authenticated using (is_admin()) with check (is_admin());

create policy user_settings_own on user_settings
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_settings_admin_read on user_settings
  for select to authenticated using (is_admin());

create policy notification_preferences_own on notification_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_admin_read on notification_preferences
  for select to authenticated using (is_admin());

-- The queue is machinery, not user data. Nobody queues their own messages;
-- rows are written by server code holding the service role.
create policy notification_queue_admin_all on notification_queue
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Seed the flags for what exists today
--
-- Everything currently public stays free. The premium entries name capabilities
-- that are being built, and are gated from the moment they appear rather than
-- shipped open and closed later, which is the change people resent.
-- ---------------------------------------------------------------------------

insert into feature_flags (key, label, description, tier, sort_order) values
  ('kundli', 'Birth chart', 'Cast a chart with houses, dignities and divisional charts.', 'free', 10),
  ('panchang', 'Panchang', 'The five limbs of the day with true sunrise.', 'free', 20),
  ('dasha', 'Dasha periods', 'Vimshottari periods and their dates.', 'free', 30),
  ('transits', 'Transits', 'Current transits, Sade Sati and its phases.', 'free', 40),
  ('matching', 'Compatibility', 'Ashtakoot matching with Mangal dosha.', 'free', 50),
  ('nakshatra', 'Nakshatra finder', 'Birth star, pada and ruling graha.', 'free', 60),
  ('yogas', 'Yogas and doshas', 'Yoga and affliction detection with the reason each one fired.', 'free', 70),
  ('ashtakavarga', 'Ashtakavarga', 'Bindu tables and sign strength.', 'free', 80),
  ('kalsarpa', 'Kalsarpa', 'Kalsarpa detection, with its historical disclaimer.', 'free', 90),
  ('save_charts', 'Saved charts', 'Keep charts on an account and return to them.', 'account', 100),
  -- Free deliberately. For a large part of the country this is simply how a
  -- chart is drawn, and asking someone to make an account to read their own
  -- chart in their own convention would be an odd thing to charge for.
  ('south_indian_chart', 'South Indian chart style', 'Switch the chart to the South Indian square layout.', 'free', 110),
  ('pdf_report', 'PDF report', 'Download a chart as a formatted report.', 'account', 120),
  ('daily_reading', 'Daily reading', 'A short reading for the day ahead.', 'premium', 200),
  ('weekly_reading', 'Weekly reading', 'The week ahead, by dasha and transit.', 'premium', 210),
  ('monthly_reading', 'Monthly reading', 'The month ahead in more depth.', 'premium', 220),
  ('yearly_reading', 'Yearly reading', 'The year ahead, reviewed before it is published.', 'premium', 230),
  ('dasha_forecast', 'Dasha forecast', 'What a named period is likely to bring.', 'premium', 240),
  ('long_forecast', 'Five and ten year outlook', 'The longer arc, period by period.', 'premium', 250),
  ('remedies', 'Remedies', 'Remedial measures for what the chart shows.', 'premium', 260),
  ('life_aspects', 'Life aspect reports', 'Career, relationships, health, wealth and study.', 'premium', 270),
  ('dos_and_donts', 'Do''s and don''ts', 'Practical guidance for the current period.', 'premium', 280),
  ('email_notifications', 'Email notifications', 'Readings and alerts by email.', 'premium', 300),
  ('whatsapp_notifications', 'WhatsApp notifications', 'Readings and alerts on WhatsApp.', 'premium', 310)
on conflict (key) do nothing;
