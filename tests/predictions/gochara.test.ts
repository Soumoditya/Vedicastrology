import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { currentTransits } from '@/lib/astro/transits';
import { gocharaReading } from '@/lib/predictions/gochara';
import { checkSafety } from '@/lib/predictions/safety';
import { transitsToRenderData } from '@/lib/chart-render/adapt';
import { GRAHAS } from '@/lib/astro/constants';
import type { BirthData } from '@/lib/astro/types';

/**
 * The transit reading, and the two charts it is read from.
 *
 * Gochara is counted from a fixed point of the birth chart, and the classical
 * table of favourable houses is a table of houses *from the Moon*. Reading it
 * from the ascendant instead is the commonest way to get a transit reading
 * quietly wrong, so the thing worth pinning down is that the two frames stay
 * distinct: the same graha, counted twice, landing in two different houses of
 * two differently-anchored charts.
 *
 * The dates are fixed rather than `new Date()`. A reading that depends on when
 * the suite happens to run is a test that fails on a Tuesday.
 */

function chartFor(year: number, month: number, day: number, hour = 10, minute = 30) {
  const birth: BirthData = {
    year,
    month,
    day,
    hour,
    minute,
    place: {
      name: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
    },
  };
  return castChart(birth);
}

const SPREAD = [
  chartFor(1990, 6, 15),
  chartFor(1974, 11, 2, 4, 5),
  chartFor(2004, 10, 12, 13, 22),
  chartFor(1958, 3, 27, 22, 45),
];

const WHEN = [
  new Date(Date.UTC(2026, 0, 15, 6, 0)),
  new Date(Date.UTC(2026, 6, 4, 18, 30)),
];

describe('the gochara reading', () => {
  it('reads every graha, and names both frames for each', () => {
    for (const chart of SPREAD) {
      for (const when of WHEN) {
        const reading = gocharaReading(chart, when);

        expect(reading.lines).toHaveLength(GRAHAS.length);
        for (const line of reading.lines) {
          expect(line.houseFromMoon).toBeGreaterThanOrEqual(1);
          expect(line.houseFromMoon).toBeLessThanOrEqual(12);
          expect(line.houseFromAscendant).toBeGreaterThanOrEqual(1);
          expect(line.houseFromAscendant).toBeLessThanOrEqual(12);
          // Both counts are stated, because a reader has to be able to check it.
          expect(line.statement).toMatch(/from your Moon/);
          expect(line.statement).toMatch(/from your ascendant/);
          expect(['favourable', 'mixed', 'difficult']).toContain(line.verdict);
        }
      }
    }
  });

  it('grades the seven classical grahas by ashtakavarga, and leaves the nodes ungraded', () => {
    for (const chart of SPREAD) {
      for (const line of gocharaReading(chart, WHEN[0]).lines) {
        if (line.graha === 'Rahu' || line.graha === 'Ketu') {
          // No bhinnashtakavarga of their own: a number here would be invented.
          expect(line.bindus).toBeNull();
        } else {
          expect(line.bindus).not.toBeNull();
          expect(line.bindus!).toBeGreaterThanOrEqual(0);
          expect(line.bindus!).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('is deterministic for the same chart and moment', () => {
    const chart = SPREAD[0];
    expect(gocharaReading(chart, WHEN[0])).toEqual(gocharaReading(chart, WHEN[0]));
  });

  it('says nothing a safety rule would refuse', () => {
    for (const chart of SPREAD) {
      for (const when of WHEN) {
        const reading = gocharaReading(chart, when);
        const prose = [
          reading.note,
          ...reading.headline,
          ...reading.paragraphs,
          ...reading.lines.flatMap((l) => [l.statement, l.reading]),
        ];
        for (const text of prose) {
          const blocking = checkSafety(text).findings.filter((f) => f.rule.severity === 'block');
          expect(blocking.map((f) => f.rule.id)).toEqual([]);
        }
      }
    }
  });
});

describe('the two transit charts', () => {
  it('anchors each chart on its own frame, and places every graha once', () => {
    for (const chart of SPREAD) {
      const positions = currentTransits(chart, WHEN[0]);

      const lagna = transitsToRenderData(positions, 'ascendant', chart.ascendant.rashi, 'Lagna');
      const chandra = transitsToRenderData(positions, 'moon', chart.byGraha.Moon.rashi, 'Chandra');

      for (const data of [lagna, chandra]) {
        expect(data.houses).toHaveLength(12);
        // Houses run in sign order from whichever point anchors the chart.
        data.houses.forEach((house, i) => {
          expect(house.house).toBe(i + 1);
          expect(house.rashi).toBe((data.ascendantRashi + i) % 12);
        });
        // Every graha is drawn, exactly once.
        const drawn = data.houses.flatMap((h) => h.grahas.map((g) => g.graha));
        expect(drawn).toHaveLength(GRAHAS.length);
        expect(new Set(drawn).size).toBe(GRAHAS.length);
      }

      expect(lagna.ascendantRashi).toBe(chart.ascendant.rashi);
      expect(chandra.ascendantRashi).toBe(chart.byGraha.Moon.rashi);
    }
  });

  it('puts a graha in the house each frame actually counts it into', () => {
    const chart = SPREAD[2];
    const positions = currentTransits(chart, WHEN[1]);

    const lagna = transitsToRenderData(positions, 'ascendant', chart.ascendant.rashi, 'Lagna');
    const chandra = transitsToRenderData(positions, 'moon', chart.byGraha.Moon.rashi, 'Chandra');

    const houseOf = (data: typeof lagna, graha: string) =>
      data.houses.find((h) => h.grahas.some((g) => g.graha === graha))!.house;

    for (const p of positions) {
      expect(houseOf(lagna, p.graha)).toBe(p.houseFromAscendant);
      expect(houseOf(chandra, p.graha)).toBe(p.houseFromMoon);
    }
  });
});
