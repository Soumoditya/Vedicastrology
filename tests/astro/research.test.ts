import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { buildResearchRow } from '@/lib/research/capture';
import { EXPECTED_SARVA_TOTAL } from '@/lib/astro/ashtakavarga';
import type { BirthData } from '@/lib/astro/types';

const local = { year: 1990, month: 8, day: 15, hour: 10, minute: 30 };

const birth: BirthData = {
  ...local,
  place: {
    name: 'Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
};

const row = buildResearchRow({
  subjectKey: 'test-subject',
  chart: castChart(birth),
  local,
});

describe('research row', () => {
  /*
    The point of these columns is that a question like "how often does Manglik
    coincide with a marriage event" is one SQL predicate. That only holds if the
    engine actually writes them, which it did not before the rule engine landed.
  */
  it('carries the yoga engine output rather than empty arrays', () => {
    expect(row.yogas.length).toBeGreaterThan(0);
    expect(new Set(row.yogas).size).toBe(row.yogas.length);
    expect(new Set(row.doshas).size).toBe(row.doshas.length);
  });

  it('stores Sarvashtakavarga as twelve totals summing to the constant', () => {
    expect(row.sarvashtakavarga).toHaveLength(12);
    expect(row.sarvashtakavarga.reduce((a, b) => a + b, 0)).toBe(EXPECTED_SARVA_TOTAL);
  });

  it('records Kalsarpa as a type name only when it forms', () => {
    if (row.kalsarpa_type === null) {
      expect(row.kalsarpa_partial).toBe(false);
    } else {
      expect(row.kalsarpa_type).toBeTruthy();
    }
  });

  it('keeps the country but not the place name', () => {
    expect(row.place_country).toBe('India');

    const serialised = JSON.stringify(row);
    // The city and region are dropped; only the last segment is kept.
    expect(serialised).not.toContain('West Bengal');
    expect(serialised).not.toContain('test-subject-name');
  });

  it('stores coordinates too coarse to locate a person', () => {
    /*
      A tenth of a degree is roughly eleven kilometres. Anything finer would
      identify a birth more precisely than the place name that is deliberately
      withheld, which is the failure this guards against.
    */
    for (const value of [row.latitude, row.longitude]) {
      const decimals = (String(value).split('.')[1] ?? '').length;
      expect(decimals).toBeLessThanOrEqual(1);
    }
  });
});
