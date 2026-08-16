import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { vargaRashi } from '@/lib/astro/divisional';
import { advice } from '@/lib/predictions/advice';
import { checkSafety } from '@/lib/predictions/safety';
import { RASHI_LORD } from '@/lib/astro/constants';
import type { BirthData } from '@/lib/astro/types';

/**
 * Chart-derived advice.
 *
 * Two things are being guarded here, and only one of them is astrology.
 *
 * The ishta devata derivation has to be reproducible: it is stated in the
 * report as a chain of reasoning, so the chain has to actually hold. An
 * earlier version did its own navamsa arithmetic, divided the whole-zodiac
 * longitude instead of the degree within the sign, and named a plausible but
 * wrong deity with complete confidence.
 *
 * The other is safety. Advice about health, money and marriage is exactly the
 * kind of text that drifts into telling somebody to skip treatment or to bet
 * the house on a transit, so every sentence this module can produce is put
 * through the same filter that guards the generated readings.
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
  chartFor(1975, 1, 3, 4, 5),
  chartFor(2001, 11, 28, 22, 15),
  chartFor(1962, 9, 9, 16, 40),
  chartFor(2015, 3, 21, 0, 5),
];

describe('ishta devata', () => {
  it('follows the stated chain: Atmakaraka, its navamsa, the twelfth, its lord', () => {
    for (const chart of SPREAD) {
      const { religious } = advice(chart);

      const ak = chart.planets.find((p) => p.graha === religious.atmakaraka);
      expect(ak).toBeDefined();

      const navamsa = vargaRashi(ak!.longitude, 'D9');
      const twelfth = (navamsa + 11) % 12;

      expect(religious.ishtaGraha).toBe(RASHI_LORD[twelfth]);
    }
  });

  it('picks the graha holding the highest degree within its own sign', () => {
    for (const chart of SPREAD) {
      const { religious } = advice(chart);

      const classical = chart.planets.filter((p) =>
        ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p.graha),
      );
      const highest = Math.max(...classical.map((p) => p.degreeInRashi));
      const chosen = classical.find((p) => p.graha === religious.atmakaraka);

      expect(chosen!.degreeInRashi).toBeCloseTo(highest, 9);
    }
  });

  it('never names a node as the Atmakaraka', () => {
    for (const chart of SPREAD) {
      const { religious } = advice(chart);
      expect(['Rahu', 'Ketu']).not.toContain(religious.atmakaraka);
    }
  });

  it('always produces a deity, a fasting day and a mantra', () => {
    for (const chart of SPREAD) {
      const { religious } = advice(chart);
      expect(religious.ishtaDevata).not.toBe('');
      expect(religious.fastingDay).not.toBe('');
      expect(religious.mantra).not.toBe('');
      expect(religious.mantraCount).toBeGreaterThan(0);
      expect(religious.practices.length).toBeGreaterThan(0);
    }
  });

  it('states the derivation so a reader can check it', () => {
    const { religious } = advice(SPREAD[0]);
    expect(religious.derivation).toContain(religious.atmakaraka);
    expect(religious.derivation).toContain(religious.ishtaGraha);
    expect(religious.derivation).toMatch(/navamsa/i);
  });
});

describe('practical advice', () => {
  it('gives something for every chart, and traces each item to a placement', () => {
    for (const chart of SPREAD) {
      const report = advice(chart);
      expect(report.practical.length).toBeGreaterThan(0);

      for (const item of report.practical) {
        expect(item.area).not.toBe('');
        expect(item.body.length).toBeGreaterThan(40);
        // The reason must name a house, otherwise it is not checkable.
        expect(item.because).toMatch(/house|mahadasha/);
      }
    }
  });

  it('reads the running period when one is given', () => {
    const report = advice(SPREAD[0], 'Saturn');
    const period = report.practical.find((i) => i.area === 'the period you are in');
    expect(period).toBeDefined();
    expect(period!.body).toContain('Saturn');
  });

  it('says plainly that it is not medical, legal or financial advice', () => {
    const report = advice(SPREAD[0]);
    expect(report.note).toMatch(/not medical, legal or financial advice/i);
    expect(report.note).toMatch(/delay seeing a doctor/i);
  });
});

describe('safety', () => {
  /*
    The whole surface, not a sample. Every sentence this module can emit for
    these charts is concatenated and run through the same filter that guards
    model-written readings, so a phrase added carelessly later cannot ship.
  */
  it('produces nothing the safety filter would block', () => {
    for (const chart of SPREAD) {
      const report = advice(chart, 'Saturn');

      const prose = [
        ...report.practical.flatMap((i) => [i.body, i.because]),
        ...report.religious.practices,
        report.religious.derivation,
        report.note,
        ...report.headline,
      ].join('\n');

      const verdict = checkSafety(prose);
      const blocking = verdict.findings.filter((f) => f.rule.severity === 'block');

      expect(blocking.map((f) => f.rule.id)).toEqual([]);
      expect(verdict.blocked).toBe(false);
    }
  });
});
