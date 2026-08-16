-- Make research consent actually writable, and let a contributor reach their
-- own row.
--
-- Three separate things were stopping the research feature from working, and
-- all three failed silently.
--
-- 1. Column grants. 20260729000200 revoked UPDATE on profiles and granted back
--    only (display_name, avatar_url), so that a row policy mistake could never
--    let somebody set their own role. That reasoning is right and stays. But
--    the four research columns were never added to the grant, so every consent
--    write failed at the privilege layer with 42501, before RLS was consulted.
--    The application discarded the error, so the checkbox simply sprang back.
--
-- 2. research_charts was admin-only. The original comment said a person must
--    not be able to read rows back, because the set is pseudonymous and
--    matching a row to a requester would re-identify them. That holds for
--    *other people's* rows. It does not hold for the row the requester
--    themselves contributed, keyed by their own subject key: they already know
--    everything in it. Without self access the life-events form could not
--    insert, could not read back, and its UPDATE matched zero rows, which
--    Postgres does not treat as an error, so the user was told "Details saved"
--    when nothing had been written.
--
-- 3. Nothing created a row on consent alone. Handled in application code.
--
-- The role column stays out of reach throughout. This grants exactly four
-- columns, each of which is the person's own decision about their own data.

grant update (
  research_consent,
  research_consent_at,
  research_subject_key,
  health_research_consent
) on public.profiles to authenticated;

-- The caller's own pseudonymous key, resolved once per statement.
--
-- SECURITY DEFINER for the same reason is_admin() is: a policy expression is
-- evaluated per row, and a plain subquery against profiles would re-enter that
-- table's own row security every time. Marked stable so the planner calls it
-- once rather than for each row of research_charts.
create or replace function public.my_research_key()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select research_subject_key from public.profiles where id = auth.uid()
$$;

revoke execute on function public.my_research_key() from public, anon;
grant execute on function public.my_research_key() to authenticated;

comment on function public.my_research_key() is
  'The calling user''s own research subject key, or null. Used by the '
  'research_charts self-access policies so a contributor can reach the row '
  'they contributed and nothing else.';

-- Self access, strictly one row: the caller's own contribution.
--
-- A null key (nobody has consented) makes every comparison null, which is not
-- true, so these policies grant nothing at all to a user who has not opted in.
create policy research_own_select on public.research_charts
  for select to authenticated
  using (subject_key = public.my_research_key());

create policy research_own_insert on public.research_charts
  for insert to authenticated
  with check (subject_key = public.my_research_key());

create policy research_own_update on public.research_charts
  for update to authenticated
  using (subject_key = public.my_research_key())
  with check (subject_key = public.my_research_key());

-- Deliberately no self DELETE policy. Withdrawal happens by clearing consent
-- on the profile, which the sync_research_consent trigger turns into the
-- delete. Keeping one route in means withdrawal cannot be half done.
