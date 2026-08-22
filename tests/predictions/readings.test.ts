import { describe, expect, it } from 'vitest';

import { checkSafety } from '@/lib/predictions/safety';
import { LAGNA_READINGS, lagnaReading, rashiFraming } from '@/lib/predictions/lagna';
import {
  NAKSHATRA_READINGS,
  nakshatraReading,
  padaEmphasis,
} from '@/lib/predictions/nakshatra-reading';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';

/*
  The interpretive prose is the part of this site a person is most likely to act
  on and the part no calculation can vouch for, so it is held to the same rule as
  the generated readings: every sentence goes through the safety filter, and the
  filter is written to catch the specific harms — a predicted death, a diagnosis,
  advice to put off a doctor, a promise about a pregnancy, an investment
  instruction, a claim about somebody who is not in the room.

  These are fixed tables rather than model output, which is exactly why the test
  matters. Nobody re-reads five thousand words after the tenth edit.
*/

describe('the twelve ascendant readings', () => {
  it('covers all twelve signs, in order', () => {
    expect(LAGNA_READINGS).toHaveLength(12);
    LAGNA_READINGS.forEach((r, i) => {
      expect(r.rashi).toBe(i);
      expect(r.name).toBe(RASHI_NAMES_EN[i]);
    });
  });

  it('says something substantial in every field', () => {
    for (const r of LAGNA_READINGS) {
      for (const field of ['bearing', 'temperament', 'constitution'] as const) {
        expect(r[field].length, `${r.name}.${field}`).toBeGreaterThan(120);
      }
    }
  });

  it('passes the safety filter', () => {
    for (const r of LAGNA_READINGS) {
      const prose = [r.bearing, r.temperament, r.constitution].join('\n');
      const result = checkSafety(prose);
      const tripped = result.findings.map((f) => `${f.rule.id}: ${f.excerpt}`);
      expect(tripped, `${r.name}`).toEqual([]);
      expect(result.blocked, `${r.name} is blocked`).toBe(false);
    }
  });

  it('wraps the index, so an out-of-range sign cannot throw', () => {
    expect(lagnaReading(12).name).toBe(RASHI_NAMES_EN[0]);
    expect(lagnaReading(-1).name).toBe(RASHI_NAMES_EN[11]);
  });

  it('frames the Moon sign without repeating the ascendant’s wording', () => {
    for (let i = 0; i < 12; i++) {
      const framing = rashiFraming(i);
      expect(framing).toContain(RASHI_NAMES_EN[i]);
      expect(checkSafety(framing).findings.map((f) => f.rule.id)).toEqual([]);
    }
  });
});

describe('the twenty-seven nakshatra readings', () => {
  it('covers all twenty-seven stars, in order', () => {
    expect(NAKSHATRA_READINGS).toHaveLength(27);
    NAKSHATRA_READINGS.forEach((r, i) => {
      expect(r.index).toBe(i);
      expect(r.name).toBe(NAKSHATRA_NAMES[i]);
    });
  });

  it('says something substantial in every field', () => {
    for (const r of NAKSHATRA_READINGS) {
      for (const field of ['nature', 'work', 'caution'] as const) {
        expect(r[field].length, `${r.name}.${field}`).toBeGreaterThan(100);
      }
    }
  });

  /*
    Every star carries a cost. A page of twenty-seven descriptions with nothing
    but strengths in it is a horoscope column, and the difference between this
    site and one is that the unflattering half is present.
  */
  it('gives every star a stated cost, not only strengths', () => {
    for (const r of NAKSHATRA_READINGS) {
      expect(r.caution.length, `${r.name} has no real caution`).toBeGreaterThan(100);
    }
  });

  it('passes the safety filter', () => {
    for (const r of NAKSHATRA_READINGS) {
      const prose = [r.nature, r.work, r.caution].join('\n');
      const result = checkSafety(prose);
      const tripped = result.findings.map((f) => `${f.rule.id}: ${f.excerpt}`);
      expect(tripped, `${r.name}`).toEqual([]);
      expect(result.blocked, `${r.name} is blocked`).toBe(false);
    }
  });

  it('wraps the index, so an out-of-range star cannot throw', () => {
    expect(nakshatraReading(27).name).toBe(NAKSHATRA_NAMES[0]);
    expect(nakshatraReading(-1).name).toBe(NAKSHATRA_NAMES[26]);
  });

  it('describes all four padas and clamps anything else', () => {
    const seen = new Set([1, 2, 3, 4].map(padaEmphasis));
    expect(seen.size).toBe(4);
    expect(padaEmphasis(0)).toBe(padaEmphasis(1));
    expect(padaEmphasis(9)).toBe(padaEmphasis(4));
  });
});
