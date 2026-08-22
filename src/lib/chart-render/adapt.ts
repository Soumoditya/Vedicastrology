import { GRAHA_ABBR, type AnyGraha } from '../astro/constants';
import type { Chart, VargaChart } from '../astro/types';
import type { ChartRenderData, RenderGraha } from './geometry';

/**
 * Adapters from engine output to render data.
 *
 * Kept deliberately thin and free of `server-only` imports so the rendering
 * layer stays usable on the client, the server computes a chart, serialises
 * it, and the browser draws it without recomputing anything.
 */

export function chartToRenderData(chart: Chart, title = 'Rashi (D1)'): ChartRenderData {
  const houses = chart.houses.map((house) => ({
    house: house.house,
    rashi: house.rashi,
    grahas: chart.planets
      .filter((p) => p.house === house.house)
      // Show them in the order they actually sit in the sign.
      .sort((a, b) => a.longitude - b.longitude)
      .map(
        /*
          `combust` and `dignity` are deliberately not carried.

          They were set on every graha of every chart and read by nothing: the
          on-screen renderer uses `abbr`, `degree` and `retrograde`, and the OG
          card renderer adds `nature`. The kundli page serialises sixteen charts
          into the payload the browser has to download and parse, so two dead
          fields per graha is a cost paid roughly a hundred and fifty times for
          no drawing. They remain optional on `RenderGraha`, for a renderer that
          one day wants to colour by dignity.
        */
        (p): RenderGraha => ({
          graha: p.graha,
          abbr: GRAHA_ABBR[p.graha],
          degree: p.degreeInRashi,
          retrograde: p.retrograde,
          nature: p.functionalNature,
        }),
      ),
  }));

  return {
    ascendantRashi: chart.ascendant.rashi,
    houses,
    title,
  };
}

/**
 * Divisional charts carry no meaningful degree, a graha's position within a
 * varga sign is not used in judgement, so degrees are omitted rather than
 * shown as a number that looks precise but means nothing.
 */
export function vargaToRenderData(
  varga: VargaChart,
  natal: Chart,
): ChartRenderData {
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNumber = i + 1;
    const rashi = (varga.ascendantRashi + i) % 12;

    return {
      house: houseNumber,
      rashi,
      grahas: varga.placements
        .filter((p) => p.house === houseNumber)
        .map((p): RenderGraha => {
          const natalPlanet = natal.byGraha[p.graha];
          return {
            graha: p.graha,
            abbr: GRAHA_ABBR[p.graha],
            retrograde: natalPlanet?.retrograde,
            nature: natalPlanet?.functionalNature,
          };
        }),
    };
  });

  return {
    ascendantRashi: varga.ascendantRashi,
    houses,
    title: `${varga.name} (${varga.code})`,
    subtitle: varga.signification,
  };
}

/**
 * A transit chart, drawn on a natal frame.
 *
 * Gochara is read by counting the grahas as they stand *now* from a fixed point
 * in the birth chart — from the ascendant, or, far more often in classical
 * practice, from the natal Moon. Either way what is drawn is the same twelve
 * houses of the natal chart with today's positions dropped into them, which is
 * why this yields the same `ChartRenderData` the natal and divisional charts do
 * and needs no change at all in the renderer.
 *
 * `from` picks which count to use, and `fromRashi` is the sign that count starts
 * in — the ascendant's sign, or the Moon's. The positions are structurally typed
 * rather than imported from `astro/transits`, which is `server-only`; this file
 * is deliberately reachable from the client.
 */
export interface TransitPositionLike {
  graha: AnyGraha;
  rashi: number;
  degreeInRashi: number;
  retrograde: boolean;
  houseFromAscendant: number;
  houseFromMoon: number;
}

export function transitsToRenderData(
  positions: readonly TransitPositionLike[],
  from: 'ascendant' | 'moon',
  fromRashi: number,
  title: string,
  subtitle?: string,
): ChartRenderData {
  const houseOf = (p: TransitPositionLike) =>
    from === 'moon' ? p.houseFromMoon : p.houseFromAscendant;

  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNumber = i + 1;

    return {
      house: houseNumber,
      rashi: (fromRashi + i) % 12,
      grahas: positions
        .filter((p) => houseOf(p) === houseNumber)
        .slice()
        .sort((a, b) => a.rashi * 30 + a.degreeInRashi - (b.rashi * 30 + b.degreeInRashi))
        .map(
          (p): RenderGraha => ({
            graha: p.graha,
            abbr: GRAHA_ABBR[p.graha],
            degree: p.degreeInRashi,
            retrograde: p.retrograde,
          }),
        ),
    };
  });

  return { ascendantRashi: fromRashi, houses, title, subtitle };
}
