-- Security hardening for the helper functions.

-- Pin the search_path. Without it, a caller able to set their own search_path
-- could shadow anything the function body resolves unqualified.
create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user is a trigger function on auth.users. It has no business being
-- reachable as a REST endpoint, so execute is revoked from every client role;
-- the trigger continues to run as the owner.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin is referenced by RLS policies, and Postgres evaluates policy
-- expressions with the privileges of the querying role — so `authenticated`
-- must retain execute or every admin policy would fail.
--
-- `anon` does not: no policy applying to anonymous visitors calls it, and an
-- anonymous caller has no auth.uid() so it could only ever return false.
--
-- The residual advisory about `authenticated` being able to call it is expected
-- and harmless: the function takes no arguments and reports only whether the
-- caller themselves is an admin, which they already know.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
