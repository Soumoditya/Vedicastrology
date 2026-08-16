-- ===========================================================================
-- Generated readings, and the queue that holds them for review.
--
-- The publishing rule is hybrid, by design:
--
--   Short content that passed the safety filter publishes automatically.
--   Anything longer, and anything that tripped a rule regardless of length,
--   waits in `pending` until the astrologer approves it.
--
-- A reading is generated once per person per period and cached here. Without
-- that a thousand members would be a thousand generations a page view rather
-- than a thousand a month.
-- ===========================================================================

create type reading_period as enum ('day', 'week', 'month', 'year', 'dasha', 'aspect');
create type reading_state as enum ('pending', 'approved', 'rejected', 'published');

create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Which saved chart it was cast for. Null when it was cast from a one-off
  -- set of birth details rather than a stored profile.
  birth_profile_id uuid references birth_profiles (id) on delete cascade,

  period reading_period not null,
  -- The period this covers, not when it was made. Two readings for the same
  -- person and the same window are the same reading.
  period_start date not null,
  period_end date not null,

  /*
    The signals the reading was written from, stored verbatim.

    This is the audit trail. Every claim in the prose is supposed to trace back
    to one of these, and without them stored there is no way to check that
    later, or to regenerate the text if the wording needs to change.
  */
  signals jsonb not null,

  body text,
  model text,

  state reading_state not null default 'pending',
  /* Which safety rules fired, if any. Empty for content that passed clean. */
  safety_findings jsonb not null default '[]',
  -- Set when the astrologer edits the generated text. The original stays in
  -- `body` history through the updated_at trail rather than being lost.
  edited boolean not null default false,
  reviewed_at timestamptz,
  review_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger readings_updated_at
  before update on readings
  for each row execute function set_updated_at();

-- One reading per person, per chart, per period, per window. This is both the
-- cache key and the thing that stops a double request generating twice.
create unique index readings_unique_window
  on readings (user_id, coalesce(birth_profile_id, '00000000-0000-0000-0000-000000000000'::uuid), period, period_start);

create index readings_review_queue_idx
  on readings (created_at desc)
  where state = 'pending';

create index readings_user_idx on readings (user_id, period_start desc);

alter table readings enable row level security;

/*
  A person reads only their own, and only once it is published.

  Deliberately not 'approved': approved is the astrologer's decision, published
  is the moment it becomes visible, and keeping them separate leaves room to
  approve a batch and release it together.

  There is no self-write policy. A reading is written by server code and
  reviewed by the astrologer; a person editing their own prediction would make
  the whole record meaningless.
*/
revoke insert, update, delete on readings from authenticated;

create policy readings_select_own on readings
  for select to authenticated
  using ((user_id = auth.uid() and state = 'published') or is_admin());

create policy readings_admin_all on readings
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Editorial notes
--
-- The astrologer's own interpretation text, keyed by signal code. Passed to
-- the writer so the prose follows one reading of a rule rather than whatever
-- the model absorbed elsewhere. This is the difference between a site with a
-- voice and a site that sounds like every other one.
-- ---------------------------------------------------------------------------

create table interpretation_notes (
  -- Matches Signal.code, for example 'dasha.mahadasha.Saturn' or
  -- 'transit.Jupiter.h10'. A prefix match is used when no exact note exists.
  code text primary key,
  label text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger interpretation_notes_updated_at
  before update on interpretation_notes
  for each row execute function set_updated_at();

alter table interpretation_notes enable row level security;

-- Not public. These are the astrologer's working notes, not site content.
create policy interpretation_notes_admin_all on interpretation_notes
  for all to authenticated using (is_admin()) with check (is_admin());
