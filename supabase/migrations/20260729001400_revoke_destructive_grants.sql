-- Revoke TRUNCATE, TRIGGER and REFERENCES from the public API roles.
--
-- Supabase grants ALL on public tables to `anon` and `authenticated` by
-- default, and ALL includes these three. They are not the same kind of
-- privilege as select and update:
--
--   TRUNCATE is not subject to row level security. Every policy in this
--   schema is written per row, and a truncate ignores all of them and empties
--   the table. Not reachable through PostgREST today, which never issues one,
--   but the privilege should not be the thing standing between the dataset and
--   an empty table.
--
--   TRIGGER lets a role attach a function to a table it can write. A trigger
--   runs as its definer, which is an escalation route that no part of this
--   application needs.
--
--   REFERENCES lets a role point a foreign key at a table, which can be used
--   to probe values it cannot select.
--
-- Nothing in the application uses any of them as anon or authenticated:
-- migrations run as the owner and server code that needs more holds the
-- service role. Removing them costs nothing and removes three whole classes of
-- problem.

revoke truncate, trigger, references
  on all tables in schema public
  from anon, authenticated;

-- Future tables must not quietly regain what was just removed. Set for the
-- role that creates them, which is the one migrations run as.
alter default privileges in schema public
  revoke truncate, trigger, references on tables
  from anon, authenticated;
