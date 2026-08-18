-- One chart is the one you meant.
--
-- The complaint was simple: "i made my account, saved my chart, still having
-- to put details again to use tools". Saving worked. What was missing was any
-- notion of *which* saved chart a signed-in visitor means by default, so every
-- tool link went to a blank form and the saved chart could only be reached by
-- noticing a row of small pills above that form.
--
-- A boolean rather than a `default_profile_id` on the user: the chart is the
-- thing that is or is not the default, the flag lives with it, and deleting a
-- chart cannot leave a dangling pointer behind.
--
-- The partial unique index is what makes the flag trustworthy. Postgres treats
-- NULLs as distinct in a unique index, so a plain unique (user_id, is_default)
-- would still allow two rows with `false`; indexing only the true rows means a
-- user can have exactly one default and any number of ordinary charts. It also
-- means a bug that tries to set a second default fails loudly at the database
-- rather than leaving two and picking whichever sorts first.

alter table birth_profiles
  add column if not exists is_default boolean not null default false;

create unique index if not exists birth_profiles_one_default_per_user
  on birth_profiles (user_id)
  where is_default;

comment on column birth_profiles.is_default is
  'The chart this user means when they have not said which. At most one per '
  'user, enforced by birth_profiles_one_default_per_user.';

-- The existing row-level policy is `for all` on `user_id = auth.uid()`, so it
-- already covers this column and needs no change. Column privileges on
-- birth_profiles were never narrowed the way profiles' were, so no grant is
-- needed either -- checked against 20260729000200 and 20260729001400 rather
-- than assumed, because a missing grant is exactly how the research consent
-- writes failed silently.

-- Backfill: anyone who has saved exactly one chart plainly means that one.
-- Someone with several has never been asked, so they are left alone and the
-- application falls back to asking rather than guessing on their behalf.
update birth_profiles p
set is_default = true
where not exists (
        select 1 from birth_profiles q
        where q.user_id = p.user_id and q.id <> p.id
      )
  and not exists (
        select 1 from birth_profiles d
        where d.user_id = p.user_id and d.is_default
      );
