import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { detectYogas, kalsarpa, KALSARPA_TYPES } from '@/lib/astro/yogas';
import {
  ashtakavarga,
  bhinnashtakavarga,
  AV_GRAHAS,
  EXPECTED_SARVA_TOTAL,
  EXPECTED_TOTALS,
} from '@/lib/astro/ashtakavarga';
import type { BirthData } from '@/lib/astro/types';

function chartFor(
  year: number, month: number, day: number, hour: number, minute: number,
) {
  const birth: BirthData = {
    year, month, day, hour, minute,
    place: {
      name: 'Kolkata, India',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
    },
  };
  return castChart(birth);
}

const reference = chartFor(1990, 8, 15, 10, 30);

/*
  February 1962 put eight bodies in Capricorn. With the seven grahas from the
  Sun to Saturn crowded into a small arc, this is a natural Kalsarpa test case.
*/
const stellium = chartFor(1962, 2, 5, 6, 0);

describe('ashtakavarga', () => {
  /*
    These totals are properties of the bindu tables, not of any chart. If a
    single entry were mistranscribed, a total would shift, so this is the
    strongest available check that the tables are right.
  */
  it('produces the fixed total for every graha, on any chart', () => {
    for (const chart of [reference, stellium]) {
      for (const graha of AV_GRAHAS) {
        const result = bhinnashtakavarga(chart, graha);
        expect(result.total, `${graha} total`).toBe(EXPECTED_TOTALS[graha]);
      }
    }
  });

  it('sums to 337 across the seven', () => {
    for (const chart of [reference, stellium]) {
      expect(ashtakavarga(chart).sarvaTotal).toBe(EXPECTED_SARVA_TOTAL);
    }
  });

  it('gives every rashi a bindu count within its possible range', () => {
    const result = ashtakavarga(reference);

    for (const chart of result.charts) {
      expect(chart.bindus).toHaveLength(12);
      for (const b of chart.bindus) {
        // One graha can receive at most one bindu from each of eight points.
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(8);
      }
    }

    for (const b of result.sarva) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(56);
    }
  });

  it('ranks strongest and weakest signs consistently', () => {
    const result = ashtakavarga(reference);

    expect(result.strongest).toHaveLength(3);
    expect(result.weakest).toHaveLength(3);
    expect(result.strongest[0].bindus).toBeGreaterThanOrEqual(
      result.weakest[0].bindus,
    );
  });
});

describe('kalsarpa', () => {
  it('names one of the twelve forms by the house Rahu occupies', () => {
    const result = kalsarpa(stellium);

    if (result.present) {
      expect(result.typeIndex).toBe(result.rahuHouse);
      expect(result.typeName).toBe(KALSARPA_TYPES[result.rahuHouse - 1].name);
      expect(result.saidToSignify).toBeTruthy();
    }
  });

  it('always carries the honesty note, present or not', () => {
    for (const chart of [reference, stellium]) {
      const result = kalsarpa(chart);
      expect(result.note).toMatch(/does not appear in the classical texts/i);
    }
  });

  it('keeps Rahu and Ketu exactly six houses apart', () => {
    const result = kalsarpa(reference);
    const gap = Math.abs(result.rahuHouse - result.ketuHouse);
    expect(gap === 6 || gap === 6).toBe(true);
  });

  it('reports partial only when exactly one graha sits outside the axis', () => {
    for (const chart of [reference, stellium]) {
      const result = kalsarpa(chart);
      if (result.partial) {
        expect(result.present).toBe(true);
        expect(result.outside).toHaveLength(1);
      }
      if (result.present && !result.partial) {
        expect(result.outside).toHaveLength(0);
      }
    }
  });

  it('has all twelve named forms defined', () => {
    expect(KALSARPA_TYPES).toHaveLength(12);
    for (const type of KALSARPA_TYPES) {
      expect(type.name).toBeTruthy();
      expect(type.said).toBeTruthy();
    }
  });
});

describe('yoga detection', () => {
  const report = detectYogas(reference);

  it('returns structured findings, each with its reason', () => {
    for (const finding of [...report.yogas, ...report.doshas]) {
      expect(finding.name).toBeTruthy();
      expect(finding.reason.length).toBeGreaterThan(20);
      expect(['benefic', 'malefic', 'mixed']).toContain(finding.polarity);
      expect(['strong', 'moderate', 'weak']).toContain(finding.strength);
      expect(finding.involvedGrahas.length).toBeGreaterThan(0);
    }
  });

  it('separates benefic findings from malefic ones', () => {
    for (const yoga of report.yogas) {
      expect(yoga.polarity).not.toBe('malefic');
    }
  });

  it('deduplicates the names list used for research and filtering', () => {
    expect(new Set(report.names).size).toBe(report.names.length);

    // Every distinct finding name must still be represented.
    const distinct = new Set([
      ...report.yogas.map((y) => y.name),
      ...report.doshas.map((y) => y.name),
    ]);
    for (const name of distinct) {
      expect(report.names).toContain(name);
    }
  });

  it('detects the reference chart’s exalted Jupiter in a kendra', () => {
    // Jupiter is exalted in Cancer and sits in the tenth, which is a kendra.
    // That is Hamsa yoga, and it must be found.
    const jupiter = reference.byGraha.Jupiter;
    expect(jupiter.dignity).toBe('exalted');
    expect([1, 4, 7, 10]).toContain(jupiter.house);

    const hamsa = report.yogas.find((y) => y.name === 'Hamsa Yoga');
    expect(hamsa).toBeDefined();
    expect(hamsa!.involvedGrahas).toContain('Jupiter');
  });

  it('does not report a Mahapurusha yoga for a strong graha outside a kendra', () => {
    // Mars is in its own sign in the reference chart. Whether Ruchaka forms
    // depends entirely on the house, and that is the condition most often
    // skipped.
    const mars = reference.byGraha.Mars;
    const ruchaka = report.yogas.find((y) => y.name === 'Ruchaka Yoga');

    if ([1, 4, 7, 10].includes(mars.house)) {
      expect(ruchaka).toBeDefined();
    } else {
      expect(ruchaka).toBeUndefined();
    }
  });

  it('never reports both Kemadruma and a lunar support yoga', () => {
    const names = report.yogas.concat(report.doshas).map((y) => y.name);
    const hasSupport =
      names.includes('Sunapha Yoga') ||
      names.includes('Anapha Yoga') ||
      names.includes('Durudhara Yoga');

    if (names.includes('Kemadruma Yoga')) {
      expect(hasSupport).toBe(false);
    }
  });

  it('only reports Neecha Bhanga for a genuinely debilitated graha', () => {
    const cancellations = report.yogas.filter(
      (y) => y.name === 'Neecha Bhanga Raja Yoga',
    );

    for (const c of cancellations) {
      const graha = c.involvedGrahas[0];
      expect(reference.byGraha[graha].dignity).toBe('debilitated');
    }
  });

  it('allows several distinct yogas to share a name on a crowded chart', () => {
    /*
      Eight bodies in one house produces many genuine Raja and Dhana yogas from
      different lord pairs. Those are separate findings that legitimately share
      a name, so the findings list may repeat while the names list must not.
    */
    const crowded = detectYogas(stellium);

    expect(new Set(crowded.names).size).toBe(crowded.names.length);

    const findings = [...crowded.yogas, ...crowded.doshas];
    expect(findings.length).toBeGreaterThanOrEqual(crowded.names.length);

    // Where a name repeats, the grahas involved must differ.
    const byName = new Map<string, string[][]>();
    for (const f of findings) {
      const list = byName.get(f.name) ?? [];
      list.push([...f.involvedGrahas].sort());
      byName.set(f.name, list);
    }
    for (const [, sets] of byName) {
      const signatures = sets.map((s) => s.join('+'));
      expect(new Set(signatures).size).toBe(signatures.length);
    }
  });
});
