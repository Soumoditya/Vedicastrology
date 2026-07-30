-- Looking up a cached reading without leaking an unreviewed one.
--
-- Two problems with reading `readings` directly from the page:
--
--   The select policy allows an administrator to see every row, so a lookup by
--   period alone returned somebody else's reading on the admin's own dashboard.
--   The scoping has to be on the caller, not on the query.
--
--   The policy deliberately hides a person's own reading until it is published,
--   which means the cache lookup missed every pending row. The page then went
--   and generated the reading again, once per view, which defeats the whole
--   point of caching and costs money on every refresh.
--
-- Widening the policy to expose own rows in any state would fix the cost and
-- break the review step, since the body of a held or rejected reading would be
-- readable over the API. So the lookup goes through here instead: it always
-- scopes to the caller, and it returns the body only when the reading has
-- actually been published.

create or replace function public.find_reading(
  p_birth_profile_id uuid,
  p_period reading_period,
  p_period_start date
)
returns table (id uuid, state reading_state, body text, edited boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.state,
    -- Held back until published. The page can say a reading exists and is
    -- waiting without being able to show what it says.
    case when r.state = 'published' then r.body else null end as body,
    r.edited
  from public.readings r
  where r.user_id = auth.uid()
    and coalesce(r.birth_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
        = coalesce(p_birth_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and r.period = p_period
    and r.period_start = p_period_start
  limit 1;
$$;

revoke execute on function public.find_reading(uuid, reading_period, date)
  from public, anon;
grant execute on function public.find_reading(uuid, reading_period, date)
  to authenticated;
