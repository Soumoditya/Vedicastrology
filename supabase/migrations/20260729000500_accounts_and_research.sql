-- Saved charts for account holders, plus a consent-based research dataset.
--
-- The two are kept deliberately separate:
--
--   birth_profiles  identified, owned by the person, used to show them their
--                   own charts. Never queried in aggregate.
--   research_charts pseudonymous, opt-in, denormalised for analysis. Carries
--                   no name, no email, and no user id.
--
-- Keeping them apart means research can be studied without handling anyone's
-- identity, and a person withdrawing consent removes their research row
-- without touching their account.

alter table public.profiles
  add column research_consent boolean not null default false,
  add column research_consent_at timestamptz,
  add column research_subject_key uuid;

comment on column public.profiles.research_consent is
  'Explicit opt-in to contributing an anonymised chart to the research set. Must never default to true.';

create table public.research_charts (
  id uuid primary key default gen_random_uuid(),

  -- Random per person, generated at consent time and stored on the profile.
  -- Not the user id, so this table cannot be rejoined to identities by anyone
  -- who obtains it alone.
  subject_key uuid not null,

  -- Birth data in full: coarsening the time would make the ascendant, and so
  -- most of the chart, useless for analysis.
  birth_year smallint not null,
  birth_month smallint not null,
  birth_day smallint not null,
  birth_hour smallint,
  birth_minute smallint,
  birth_time_known boolean not null default true,
  timezone text not null,
  utc_offset_minutes integer not null,
  latitude double precision not null,
  longitude double precision not null,
  -- Country only. The exact place name is identifying and is not kept.
  place_country text,

  ascendant_rashi smallint not null,
  ascendant_degree numeric(6, 3) not null,
  ascendant_nakshatra smallint not null,
  sun_rashi smallint not null,
  moon_rashi smallint not null,
  moon_nakshatra smallint not null,
  moon_pada smallint not null,
  birth_dasha_lord text not null,

  planets jsonb not null,
  vargas jsonb,
  yogas text[] not null default '{}',

  gender text,
  birth_time_accuracy text,
  life_events jsonb,

  -- Provenance, so a later engine change cannot silently mix method variants
  -- into one dataset.
  ayanamsa text not null,
  house_system text not null,
  node_type text not null,
  engine_version text not null default '1',

  source text not null default 'account',
  created_at timestamptz not null default now(),

  constraint research_month_valid check (birth_month between 1 and 12),
  constraint research_day_valid check (birth_day between 1 and 31),
  constraint research_rashi_valid check (
    ascendant_rashi between 0 and 11
    and sun_rashi between 0 and 11
    and moon_rashi between 0 and 11
  )
);

-- One contribution per person, so the dataset never double counts anybody.
create unique index research_charts_subject_idx on public.research_charts (subject_key);
create index research_charts_ascendant_idx on public.research_charts (ascendant_rashi);
create index research_charts_moon_nakshatra_idx on public.research_charts (moon_nakshatra);
create index research_charts_dasha_idx on public.research_charts (birth_dasha_lord);

alter table public.research_charts enable row level security;

-- Administrators only. There is deliberately no policy letting a person read
-- rows back, because they are pseudonymous and matching one to a requester
-- would mean re-identifying them.
create policy research_admin_all on public.research_charts
  for all to authenticated using (is_admin()) with check (is_admin());

-- Clearing consent, or deleting the profile, removes the contribution.
-- Enforced by trigger so withdrawal cannot be forgotten in application code.
create or replace function public.sync_research_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE') or (new.research_consent is false) then
    delete from public.research_charts
    where subject_key = coalesce(old.research_subject_key, new.research_subject_key);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger profiles_research_consent
  after update of research_consent on public.profiles
  for each row execute function public.sync_research_consent();

create trigger profiles_research_delete
  before delete on public.profiles
  for each row execute function public.sync_research_consent();

revoke execute on function public.sync_research_consent() from public, anon, authenticated;
