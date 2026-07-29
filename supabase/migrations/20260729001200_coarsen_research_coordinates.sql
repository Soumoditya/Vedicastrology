-- Coarsen stored research coordinates.
--
-- The table stored latitude and longitude to four decimal places, which locates
-- a birth to about eleven metres. That sat directly beneath a comment
-- explaining that the exact place name is withheld because it narrows a person
-- too far, while storing something far sharper than the name.
--
-- A tenth of a degree is roughly eleven kilometres. Every regional question
-- stays answerable and no row points at an address. The chart itself is
-- unaffected: graha positions were computed from full precision coordinates
-- before this rounding, and it is the positions that are stored.

update public.research_charts
set latitude = round(latitude::numeric, 1)::double precision,
    longitude = round(longitude::numeric, 1)::double precision
where latitude <> round(latitude::numeric, 1)::double precision
   or longitude <> round(longitude::numeric, 1)::double precision;

comment on column public.research_charts.latitude is
  'Birth latitude, rounded to a tenth of a degree so a row cannot locate a person.';
comment on column public.research_charts.longitude is
  'Birth longitude, rounded to a tenth of a degree so a row cannot locate a person.';
