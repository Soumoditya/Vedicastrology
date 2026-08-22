import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { gemstones, remedies } from '@/lib/predictions/remedies';
import { checkSafety } from '@/lib/predictions/safety';
import { GRAHAS } from '@/lib/astro/constants';
import type { BirthData } from '@/lib/astro/types';

/**
 * The remedy report reads the whole chart.
 *
 * It used to emit only the grahas that had failed a check, which meant a clean
 * chart produced an empty page and a chart with three afflictions implied the
 * other six grahas had no bearing on anything. Widening it to all nine is the
 * behaviour these tests pin down — along with the two properties that widening
 * could plausibly break.
 *
 * The first is that every graha still carries a *reason*. The point of a fixed
 * remedy table is that a suggestion can be checked rather than believed, and a
 * graha included merely to fill out a list of nine, with nothing said about why,
 * would quietly destroy that.
 *
 * The second is safety. This is text about health, money and marriage that a
 * person may act on, so every sentence the module can produce goes through the
 * same filter that guards the generated readings.
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
  chartFor(2019, 1, 9, 6, 0),
];

describe('the remedy report covers the whole chart', () => {
  it('reads all nine grahas, whatever the chart', () => {
    for (const chart of SPREAD) {
      const report = remedies(chart);
      expect(report.grahas).toHaveLength(9);
      expect(new Set(report.grahas.map((g) => g.graha)).size).toBe(9);
      for (const graha of GRAHAS) {
        expect(report.grahas.some((g) => g.graha === graha)).toBe(true);
      }
    }
  });

  it('gives every graha a reason, a condition and practical advice', () => {
    for (const chart of SPREAD) {
      for (const reading of remedies(chart).grahas) {
        expect(reading.reasons.length).toBeGreaterThan(0);
        for (const reason of reading.reasons) expect(reason.trim()).not.toBe('');
        expect(['strained', 'mixed', 'supported']).toContain(reading.condition);
        expect(reading.practical.trim()).not.toBe('');
        expect(reading.tips.length).toBeGreaterThan(0);
      }
    }
  });

  it('orders the strained ones first, so the page reads top down', () => {
    const rank = { strained: 0, mixed: 1, supported: 2 };
    for (const chart of SPREAD) {
      const order = remedies(chart).grahas.map((g) => rank[g.condition]);
      const sorted = [...order].sort((a, b) => a - b);
      expect(order).toEqual(sorted);
    }
  });

  it('offers the four measures for every graha, and no gemstone among them', () => {
    for (const chart of SPREAD) {
      for (const reading of remedies(chart).grahas) {
        expect(reading.measures.map((m) => m.kind).sort()).toEqual([
          'charity',
          'conduct',
          'fasting',
          'mantra',
        ]);
        // Gemstones moved to their own page; a stray one here would put the
        // costly remedy back among the free ones with no caveat attached.
        for (const measure of reading.measures) {
          expect(measure.kind).not.toBe('gemstone');
        }
      }
    }
  });

  it('says nothing a safety rule would refuse', () => {
    for (const chart of SPREAD) {
      const report = remedies(chart);
      const prose = [
        report.note,
        ...report.grahas.flatMap((g) => [g.practical, ...g.reasons, ...g.tips]),
        ...report.remedies.map((r) => r.action),
      ];
      for (const text of prose) {
        const blocking = checkSafety(text).findings.filter((f) => f.rule.severity === 'block');
        expect(blocking.map((f) => f.rule.id)).toEqual([]);
      }
    }
  });
});

describe('gemstones', () => {
  it('names a stone only where a graha is under pressure', () => {
    for (const chart of SPREAD) {
      const report = gemstones(chart);
      expect(report.entries).toHaveLength(9);

      for (const entry of report.entries) {
        expect(entry.indicated).toBe(entry.condition === 'strained');
        expect(entry.because.trim()).not.toBe('');
        // The conventions are the whole content of the page; a blank one would
        // render an empty cell rather than fail visibly.
        expect(entry.convention.stone.trim()).not.toBe('');
        expect(entry.convention.metal.trim()).not.toBe('');
        expect(entry.convention.finger.trim()).not.toBe('');
        expect(entry.convention.day.trim()).not.toBe('');
        expect(entry.convention.substitute.trim()).not.toBe('');
      }

      expect(report.indicated).toEqual(report.entries.filter((e) => e.indicated));
    }
  });

  it('always carries the caveat, whether or not a stone is indicated', () => {
    for (const chart of SPREAD) {
      const report = gemstones(chart);
      expect(report.caveat).toMatch(/no classical text makes a stone the primary remedy/i);
      expect(report.note.trim()).not.toBe('');
      for (const text of [report.caveat, report.note]) {
        const blocking = checkSafety(text).findings.filter((f) => f.rule.severity === 'block');
        expect(blocking.map((f) => f.rule.id)).toEqual([]);
      }
    }
  });
});
