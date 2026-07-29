import { GRAHA_ABBR } from '../astro/constants';
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
        (p): RenderGraha => ({
          graha: p.graha,
          abbr: GRAHA_ABBR[p.graha],
          degree: p.degreeInRashi,
          retrograde: p.retrograde,
          combust: p.combust,
          dignity: p.dignity,
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
