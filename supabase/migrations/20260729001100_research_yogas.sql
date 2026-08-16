-- Research columns fed by the yoga rule engine.
--
-- `yogas` already existed but was written empty, because the engine did not
-- exist when the table was created. These add the rest of what the engine
-- produces, as separate columns rather than one blob, so the questions that
-- matter are a plain SQL predicate:
--
--   how often does Manglik coincide with a marriage life event
--   which ascendants most often carry a Panch Mahapurusha yoga
--   does Kalsarpa correlate with anything at all, which is the honest question
--
-- Kept as arrays and scalars rather than jsonb for exactly that reason. An
-- array supports `where 'Hamsa Yoga' = any(yogas)` and can be GIN indexed;
-- a jsonb blob would need unpacking every time.

alter table public.research_charts
  add column if not exists doshas text[] not null default '{}',
  add column if not exists manglik boolean,
  add column if not exists manglik_cancelled boolean,
  -- Null when the configuration does not form, the type name when it does.
  add column if not exists kalsarpa_type text,
  add column if not exists kalsarpa_partial boolean,
  -- Twelve Sarvashtakavarga totals, Aries first. Stored rather than recomputed
  -- so a strength question is a single query over the table.
  add column if not exists sarvashtakavarga smallint[];

-- The whole point of the arrays is containment queries, so index for them.
create index if not exists research_charts_yogas_idx
  on public.research_charts using gin (yogas);
create index if not exists research_charts_doshas_idx
  on public.research_charts using gin (doshas);
create index if not exists research_charts_manglik_idx
  on public.research_charts (manglik) where manglik is true;

comment on column public.research_charts.yogas is
  'Deduplicated names of every benefic yoga the engine detected.';
comment on column public.research_charts.doshas is
  'Deduplicated names of every affliction the engine detected.';
comment on column public.research_charts.sarvashtakavarga is
  'Twelve Sarvashtakavarga bindu totals, index 0 for Aries. Always sums to 337.';
