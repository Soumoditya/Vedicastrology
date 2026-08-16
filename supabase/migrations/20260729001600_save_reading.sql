-- Saving a generated reading.
--
-- `authenticated` has no insert privilege on `readings`, deliberately: a person
-- who could write their own prediction row could set its state to published and
-- the review step would mean nothing. So writes go through this one function.
--
-- The important part is that the publishing decision is made here, in the
-- database, and not by the caller. The application passes the safety findings
-- and the period; it does not get to say whether the result is published. A bug
-- in the application therefore cannot release unreviewed content, which is the
-- whole point of having a review step.
--
-- The rule, stated once:
--
--   a short period with no safety findings publishes immediately;
--   everything else waits as pending.
--
-- The alternative was a service role key in the deployment, which would let any
-- server code bypass row level security everywhere. This is narrower: one
-- function, one table, one decision.

create or replace function public.save_reading(
  p_birth_profile_id uuid,
  p_period reading_period,
  p_period_start date,
  p_period_end date,
  p_signals jsonb,
  p_body text,
  p_model text,
  p_safety jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_state reading_state;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Not signed in.';
  end if;

  -- A reading must belong to a chart the caller actually owns. Without this
  -- check somebody could attach their reading to another person's saved chart.
  if p_birth_profile_id is not null and not exists (
    select 1 from public.birth_profiles b
    where b.id = p_birth_profile_id and b.user_id = v_user
  ) then
    raise exception 'That chart does not belong to you.';
  end if;

  if p_period_end < p_period_start then
    raise exception 'The period ends before it starts.';
  end if;

  v_state := case
    when p_safety = '[]'::jsonb and p_period in ('day', 'week') then 'published'
    else 'pending'
  end;

  insert into public.readings (
    user_id, birth_profile_id, period, period_start, period_end,
    signals, body, model, state, safety_findings
  )
  values (
    v_user, p_birth_profile_id, p_period, p_period_start, p_period_end,
    p_signals, p_body, p_model, v_state, coalesce(p_safety, '[]'::jsonb)
  )
  -- The unique window index is the cache key. A second request for the same
  -- window returns the reading that already exists rather than making another.
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select r.id into v_id
    from public.readings r
    where r.user_id = v_user
      and coalesce(r.birth_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
          = coalesce(p_birth_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and r.period = p_period
      and r.period_start = p_period_start;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_reading(
  uuid, reading_period, date, date, jsonb, text, text, jsonb
) from public, anon;

grant execute on function public.save_reading(
  uuid, reading_period, date, date, jsonb, text, text, jsonb
) to authenticated;
