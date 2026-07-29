-- Life events for the research set.
--
-- These are what let the dataset test a classical claim rather than only
-- describe chart distributions. "Does the 7th lord period coincide with
-- marriage" is answerable only if marriage years are recorded.
--
-- Every field is optional and only ever collected from someone who has already
-- opted in.

-- Health data is special category under GDPR Article 9 and sensitive under the
-- DPDP Act. It carries its own opt-in rather than riding on the general
-- research consent, because bundling it would make that consent invalid.
alter table public.profiles
  add column health_research_consent boolean not null default false;

comment on column public.profiles.health_research_consent is
  'Separate explicit opt-in for health related life events. Special category data; must never be bundled with general research consent.';

alter table public.research_charts
  add column marital_status text,
  add column marriage_year smallint,
  add column children_count smallint,
  add column first_child_year smallint,
  add column education_level text,
  add column occupation_category text,
  add column career_change_years smallint[] not null default '{}',
  add column relocation_years smallint[] not null default '{}',
  -- Only ever populated when health_research_consent is also true.
  add column major_health_years smallint[] not null default '{}',
  add column notable_events jsonb,
  add column life_events_updated_at timestamptz;

-- Fixed vocabularies, enforced by the database. Free text would turn
-- occupation into a thousand unique job titles and stop the set being
-- groupable, which defeats the point of collecting it.
alter table public.research_charts
  add constraint marital_status_known check (
    marital_status is null or marital_status in
    ('single', 'married', 'divorced', 'widowed', 'partnered')
  ),
  add constraint education_level_known check (
    education_level is null or education_level in
    ('school', 'diploma', 'bachelors', 'masters', 'doctorate', 'other')
  ),
  add constraint occupation_category_known check (
    occupation_category is null or occupation_category in
    ('business', 'government', 'medicine', 'engineering_tech', 'education',
     'law', 'arts_media', 'finance', 'agriculture', 'trades', 'service',
     'homemaker', 'student', 'retired', 'spiritual', 'other')
  ),
  add constraint marriage_year_plausible check (
    marriage_year is null or marriage_year between 1800 and 2400
  ),
  add constraint first_child_year_plausible check (
    first_child_year is null or first_child_year between 1800 and 2400
  ),
  add constraint children_count_plausible check (
    children_count is null or children_count between 0 and 30
  );

create index research_charts_marriage_idx
  on public.research_charts (marriage_year) where marriage_year is not null;
create index research_charts_occupation_idx
  on public.research_charts (occupation_category) where occupation_category is not null;

-- Withdrawing health consent alone clears the health years while leaving the
-- rest of the contribution intact.
create or replace function public.sync_health_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.health_research_consent is false and old.health_research_consent is true then
    update public.research_charts
    set major_health_years = '{}'
    where subject_key = new.research_subject_key;
  end if;
  return new;
end;
$$;

create trigger profiles_health_consent
  after update of health_research_consent on public.profiles
  for each row execute function public.sync_health_consent();

revoke execute on function public.sync_health_consent() from public, anon, authenticated;
