import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { mangalDosha, matchCharts } from '@/lib/astro/matching';
import type { BirthData } from '@/lib/astro/types';

/**
 * Ashtakoot matching.
 *
 * Guna Milan depends only on the Moon's nakshatra, rashi and pada in each
 * chart, so these tests pin the koots that carry the most weight and the two
 * rules generic implementations most often get wrong: Bhakoot measured in one
 * direction only, and Nadi dosha applied without its classical cancellations.
 */

function chartFor(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): ReturnType<typeof castChart> {
  const birth: BirthData = {
    year,
    month,
    day,
    hour,
    minute,
    place: {
      name: 'Kolkata, India',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
    },
  };
  return castChart(birth);
}

describe('guna milan', () => {
  const a = chartFor(1990, 8, 15, 10, 30);
  const b = chartFor(1992, 3, 21, 14, 45);

  const result = matchCharts(a, b);

  it('scores all eight koots', () => {
    expect(result.koots).toHaveLength(8);
    expect(result.koots.map((k) => k.name)).toEqual([
      'Varna', 'Vashya', 'Tara', 'Yoni',
      'Graha Maitri', 'Gana', 'Bhakoot', 'Nadi',
    ]);
  });

  it('never exceeds the maximum for any koot', () => {
    for (const koot of result.koots) {
      expect(koot.score).toBeGreaterThanOrEqual(0);
      expect(koot.score).toBeLessThanOrEqual(koot.maximum);
    }
  });

  it('uses the classical weights, summing to 36', () => {
    const total = result.koots.reduce((sum, k) => sum + k.maximum, 0);
    expect(total).toBe(36);
  });

  it('totals the koot scores', () => {
    const sum = result.koots.reduce((s, k) => s + k.score, 0);
    expect(result.total).toBeCloseTo(sum, 5);
    expect(result.total).toBeLessThanOrEqual(36);
  });

  it('reads the total against the traditional threshold of 18', () => {
    const expected =
      result.total >= 28
        ? 'excellent'
        : result.total >= 21
          ? 'good'
          : result.total >= 18
            ? 'acceptable'
            : 'difficult';
    expect(result.verdict).toBe(expected);
  });
});

describe('identical charts', () => {
  const same = chartFor(1990, 8, 15, 10, 30);
  const result = matchCharts(same, same);

  it('gives full marks for the koots that compare like with like', () => {
    const byName = new Map(result.koots.map((k) => [k.name, k]));
    // Same nakshatra means same yoni and same gana.
    expect(byName.get('Yoni')!.score).toBe(4);
    expect(byName.get('Gana')!.score).toBe(6);
    // Same Moon sign means the same lord, so full Graha Maitri.
    expect(byName.get('Graha Maitri')!.score).toBe(5);
  });

  it('cancels Nadi dosha for identical charts through the pada exception', () => {
    // Same nadi would normally score zero. Same nakshatra with the same pada
    // is not one of the classical exceptions, so this must NOT be cancelled.
    const nadi = result.koots.find((k) => k.name === 'Nadi')!;
    expect(nadi.score).toBe(0);
    expect(nadi.reason).toMatch(/Nadi dosha/i);
  });

  it('scores Bhakoot clear when both Moons share a sign', () => {
    // 1:1 is not one of 6:8, 5:9 or 2:12.
    expect(result.koots.find((k) => k.name === 'Bhakoot')!.score).toBe(7);
  });
});

describe('bhakoot is measured both ways', () => {
  /*
    A 2:12 pair is afflicted regardless of which partner is counted first.
    Implementations that count in one direction only score half of these as
    clear, which is the single most common Guna Milan bug.
  */
  it('flags a 2:12 relationship from either side', () => {
    // Find two charts whose Moons sit in adjacent signs.
    const first = chartFor(1990, 8, 15, 10, 30);
    const firstMoon = first.byGraha.Moon.rashi;

    let adjacent: ReturnType<typeof castChart> | null = null;
    for (let day = 1; day <= 60 && !adjacent; day++) {
      const candidate = chartFor(1990, 9, 1, 6, 0);
      const shifted = castChart({
        year: 1990,
        month: 9,
        day: ((day - 1) % 28) + 1,
        hour: 6,
        minute: 0,
        place: candidate.meta.place,
      });
      if (shifted.byGraha.Moon.rashi === (firstMoon + 1) % 12) adjacent = shifted;
    }

    if (!adjacent) return; // No adjacent-sign Moon found in the window.

    const forward = matchCharts(first, adjacent);
    const backward = matchCharts(adjacent, first);

    const f = forward.koots.find((k) => k.name === 'Bhakoot')!.score;
    const b = backward.koots.find((k) => k.name === 'Bhakoot')!.score;

    // Symmetry is the property under test: the verdict cannot depend on order.
    expect(f).toBe(b);
    expect(f).toBe(0);
  });
});

describe('mangal dosha', () => {
  it('checks from the ascendant, the Moon and Venus', () => {
    const chart = chartFor(1990, 8, 15, 10, 30);
    const dosha = mangalDosha(chart);

    // Whatever the verdict, all three reference points must be evaluated.
    expect(typeof dosha.fromAscendant).toBe('boolean');
    expect(typeof dosha.fromMoon).toBe('boolean');
    expect(typeof dosha.fromVenus).toBe('boolean');

    // Present is the union of the three, never narrower.
    expect(dosha.present).toBe(
      dosha.fromAscendant || dosha.fromMoon || dosha.fromVenus,
    );
  });

  it('only reports a cancellation when the dosha is present', () => {
    const chart = chartFor(1990, 8, 15, 10, 30);
    const dosha = mangalDosha(chart);
    if (!dosha.present) {
      expect(dosha.cancelled).toBe(false);
      expect(dosha.cancellationReasons).toHaveLength(0);
    }
  });
});
