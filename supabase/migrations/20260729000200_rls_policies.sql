-- Row level security policies.
--
--   * anonymous visitors read only published content;
--   * they may submit enquiries, testimonials and newsletter signups, but
--     never choose their own moderation status;
--   * signed-in users read and write only their own rows;
--   * admins do everything, via the SECURITY DEFINER is_admin() helper.

-- profiles
--
-- Column-level grants, not just policies. A row policy alone would let a user
-- update their own profile *including* the role column and make themselves an
-- admin. Restricting the grant to the two display columns removes that at the
-- privilege layer, where a policy mistake cannot reopen it.
revoke update on profiles from authenticated;
grant update (display_name, avatar_url) on profiles to authenticated;

create policy profiles_select_own on profiles
  for select to authenticated using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all to authenticated using (is_admin()) with check (is_admin());

-- birth_profiles — strictly private to their owner.
create policy birth_profiles_own on birth_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public catalogue.
create policy regions_public_read on regions
  for select to anon, authenticated using (true);
create policy regions_admin_all on regions
  for all to authenticated using (is_admin()) with check (is_admin());

create policy services_public_read on services
  for select to anon, authenticated using (is_active);
create policy services_admin_all on services
  for all to authenticated using (is_admin()) with check (is_admin());

-- Prices are visible only for services that are themselves visible, so an
-- unpublished service cannot have its pricing read ahead of launch.
create policy service_prices_public_read on service_prices
  for select to anon, authenticated using (
    exists (select 1 from services s where s.id = service_id and s.is_active)
  );
create policy service_prices_admin_all on service_prices
  for all to authenticated using (is_admin()) with check (is_admin());

-- Blog
create policy categories_public_read on categories
  for select to anon, authenticated using (true);
create policy categories_admin_all on categories
  for all to authenticated using (is_admin()) with check (is_admin());

create policy tags_public_read on tags
  for select to anon, authenticated using (true);
create policy tags_admin_all on tags
  for all to authenticated using (is_admin()) with check (is_admin());

-- A scheduled post stays invisible until its publication time passes, so
-- scheduling is enforced by the database rather than by a query filter someone
-- could forget to write.
create policy posts_public_read on posts
  for select to anon, authenticated using (
    status = 'published' and published_at is not null and published_at <= now()
  );
create policy posts_admin_all on posts
  for all to authenticated using (is_admin()) with check (is_admin());

create policy post_tags_public_read on post_tags
  for select to anon, authenticated using (
    exists (
      select 1 from posts p
      where p.id = post_id and p.status = 'published'
        and p.published_at is not null and p.published_at <= now()
    )
  );
create policy post_tags_admin_all on post_tags
  for all to authenticated using (is_admin()) with check (is_admin());

-- testimonials — anyone may submit, but only as 'pending'. The WITH CHECK makes
-- self-approval impossible rather than merely discouraged.
create policy testimonials_public_read on testimonials
  for select to anon, authenticated using (status = 'approved');
create policy testimonials_insert on testimonials
  for insert to anon, authenticated with check (status = 'pending' and not is_featured);
create policy testimonials_read_own on testimonials
  for select to authenticated using (user_id = auth.uid());
create policy testimonials_admin_all on testimonials
  for all to authenticated using (is_admin()) with check (is_admin());

-- enquiries — submitted by anyone, readable only by their author and admins.
create policy enquiries_insert on enquiries
  for insert to anon, authenticated with check (status = 'new');
create policy enquiries_read_own on enquiries
  for select to authenticated using (user_id = auth.uid());
create policy enquiries_admin_all on enquiries
  for all to authenticated using (is_admin()) with check (is_admin());

-- orders — no client writes. Payments will be recorded server-side through the
-- service role, which bypasses RLS.
create policy orders_read_own on orders
  for select to authenticated using (user_id = auth.uid());
create policy orders_admin_all on orders
  for all to authenticated using (is_admin()) with check (is_admin());

create policy site_settings_public_read on site_settings
  for select to anon, authenticated using (true);
create policy site_settings_admin_all on site_settings
  for all to authenticated using (is_admin()) with check (is_admin());

-- newsletter_subscribers — insert only. Deliberately no public select:
-- allowing reads would expose the whole subscriber list to anyone holding the
-- publishable key.
create policy newsletter_insert on newsletter_subscribers
  for insert to anon, authenticated with check (not confirmed);
create policy newsletter_admin_all on newsletter_subscribers
  for all to authenticated using (is_admin()) with check (is_admin());
