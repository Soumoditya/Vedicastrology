# Vedic Astrologey

Vedic astrology platform — accurate birth charts, panchang, dasha periods and
transit readings, with services, pricing and a journal.

## Why the calculations can be trusted

Positions come from the [Swiss Ephemeris](https://www.astro.com/swisseph/) with
its full-precision data files bundled (`ephe/`, 1.8 MB, covering 1800–2400 CE).
If those files are ever missing from a deployment the engine falls back to the
built-in Moshier ephemeris, which agrees to under 0.3 arc-seconds — so a
deployment mishap costs precision, not correctness.

Three things that are commonly got wrong and are handled here:

- **Historical time zones.** India used Madras Mean Time (+05:21:10) before 1906
  and +06:30 from 1942 to 1945. Software that assumes +05:30 produces charts
  that are wrong in every value while still looking entirely plausible. Offsets
  come from the IANA database, including worldwide daylight saving and the
  ambiguous or non-existent local times that occur at a transition.
- **Sunrise convention.** Panchang uses the Hindu rule — centre of the disc, no
  refraction — not the Western upper-limb-with-refraction rule. The two differ
  by two to four minutes, regularly enough to change which tithi a day is named
  for.
- **Divisional charts.** Each varga has its own rule for where the count begins,
  keyed off the sign's movable/fixed/dual quality or its parity. D30 alone has
  unequal divisions.

The test suite asserts graha longitudes to **one arc-second** against values
generated independently by the Swiss Ephemeris, so drift in the ayanamsa, node
type or time handling fails the build rather than shipping quietly.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

```bash
npm test          # astrology accuracy suite
npm run typecheck
npm run build
```

## Database

Schema lives in `supabase/migrations/` and is applied in filename order. Row
level security is enabled on every table: anonymous visitors read only published
content, signed-in users reach only their own rows, and administrators are
identified by a `SECURITY DEFINER` `is_admin()` helper.

Saved charts store **only raw birth details**. Charts are always recomputed, so
an engine correction improves every saved chart rather than leaving stale
results behind.

## Pricing

Regions are rows in the database, not code. Each has a currency and a list of
country codes, and each service carries one hand-entered price per region —
nothing is converted at an exchange rate. Selling into a new market is a row in
the admin panel, not a deployment.

## Licence

The Swiss Ephemeris is dual-licensed AGPL / commercial. This repository is
public in order to satisfy the AGPL. No credentials are committed; all keys are
supplied through environment variables.
