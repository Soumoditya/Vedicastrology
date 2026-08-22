-- ---------------------------------------------------------------------------
-- The gemstone tool gets a flag of its own
--
-- Gemstones moved off the remedies page and onto `/tools/gemstones`, which is
-- listed in the tool index and in the journey rail's row of specific checks.
-- Both of those ask `canUse` about every feature they list, and `canUse`
-- refuses an unknown key by design — a typo should make a feature disappear
-- rather than quietly ungate a paid one. Without this row the tool would show
-- as unavailable in both places.
--
-- Free, and for the same reason Kalsarpa and the South Indian chart style are:
-- what the page mostly does is explain why no classical text makes a stone the
-- primary remedy. Charging for that would be an odd thing to do.
--
-- The page itself is gated on `remedies` rather than on this key, so it keeps
-- working whether or not this migration has been applied. Applying it is what
-- makes the tool visible in the index and the rail.
-- ---------------------------------------------------------------------------

insert into feature_flags (key, label, description, tier, sort_order) values
  (
    'gemstones',
    'Gemstones',
    'Which stones a chart names, how each is worn, and the case against buying one.',
    'free',
    265
  )
on conflict (key) do nothing;
