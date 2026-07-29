-- Starting data.
--
-- Two regions so pricing works on day one. More are added from the admin
-- panel — this is a starting point, not a fixed list.
--
-- 'International' carries no country codes and is not the default: it is the
-- catch-all, matched when a visitor's country belongs to no region. India is
-- the default, so a visitor whose country cannot be determined at all still
-- sees a price rather than a blank.

insert into regions (code, name, currency, symbol, country_codes, is_default, sort_order)
values
  ('IN', 'India', 'INR', '₹', array['IN'], true, 0),
  ('INTL', 'International', 'USD', '$', array[]::text[], false, 100);

insert into site_settings (id, instagram_handle, hero_heading, hero_subheading)
values (
  true,
  'vedic_astrologey',
  'Read your chart as it truly stands.',
  'Classical Vedic astrology, calculated with the Swiss Ephemeris to the arc-second — not estimated.'
);

insert into categories (slug, name, description, sort_order)
values
  ('foundations', 'Foundations', 'The building blocks of Jyotish — grahas, rashis, bhavas and nakshatras.', 0),
  ('reading-charts', 'Reading Charts', 'How to actually interpret a chart, worked through with examples.', 1),
  ('transits', 'Transits & Timing', 'Gochara, dashas, Sade Sati and the timing of events.', 2),
  ('remedies', 'Remedies & Practice', 'Traditional upayas, mantra, and living with your chart.', 3);
