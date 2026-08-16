import { describe, expect, it } from 'vitest';

import { astroNames, GRAHA_ORDER } from '@/lib/i18n/astro-names';
import { LOCALES, type Locale } from '@/lib/i18n/locales';
import {
  BHAVA_NAMES,
  NAKSHATRA_NAMES,
  RASHI_NAMES_EN,
  TITHI_NAMES,
  VARA_NAMES_EN,
} from '@/lib/astro/constants';
import { DIGNITY_LABEL } from '@/lib/astro/dignity';
import type { Dignity } from '@/lib/astro/types';

/**
 * The translated astrological vocabulary.
 *
 * Every list here is indexed by a number the engine produces, so a list that is
 * one entry short does not throw: it falls back to English for that one entry
 * and everything looks fine until somebody is born under the twenty seventh
 * nakshatra. These tests check length and completeness rather than
 * translation quality, because length is the failure that hides.
 */

const TRANSLATED: Locale[] = LOCALES.filter((l) => l !== 'en');

describe('completeness', () => {
  for (const locale of LOCALES) {
    const names = astroNames(locale);

    it(`${locale}: names all twelve rashis`, () => {
      for (let i = 0; i < RASHI_NAMES_EN.length; i++) {
        expect(names.rashi(i)).not.toBe('');
      }
    });

    it(`${locale}: names all twenty seven nakshatras`, () => {
      for (let i = 0; i < NAKSHATRA_NAMES.length; i++) {
        expect(names.nakshatra(i)).not.toBe('');
      }
    });

    it(`${locale}: names all nine grahas`, () => {
      for (const graha of GRAHA_ORDER) {
        expect(names.graha(graha)).not.toBe('');
      }
    });

    it(`${locale}: names all twelve bhavas, counting houses from one`, () => {
      for (let house = 1; house <= BHAVA_NAMES.length; house++) {
        expect(names.bhava(house)).not.toBe('');
      }
    });

    it(`${locale}: names all fourteen tithis and seven varas`, () => {
      for (let i = 0; i < TITHI_NAMES.length; i++) {
        expect(names.tithi(i)).not.toBe('');
      }
      for (let i = 0; i < VARA_NAMES_EN.length; i++) {
        expect(names.vara(i)).not.toBe('');
      }
    });

    it(`${locale}: names every dignity`, () => {
      for (const dignity of Object.keys(DIGNITY_LABEL) as Dignity[]) {
        expect(names.dignity(dignity)).not.toBe('');
      }
    });

    it(`${locale}: names both pakshas`, () => {
      expect(names.paksha('Shukla')).not.toBe('');
      expect(names.paksha('Krishna')).not.toBe('');
    });
  }
});

describe('the translations are actually translations', () => {
  /*
    A list that was copied from English rather than translated would pass every
    completeness check above. These assert that Hindi and Bengali differ from
    English, which is the whole point of the feature: the reported complaint
    was that switching language changed almost nothing on screen.
  */
  for (const locale of TRANSLATED) {
    const names = astroNames(locale);
    const english = astroNames('en');

    it(`${locale}: differs from English for every rashi`, () => {
      for (let i = 0; i < 12; i++) {
        expect(names.rashi(i)).not.toBe(english.rashi(i));
      }
    });

    it(`${locale}: differs from English for every nakshatra`, () => {
      for (let i = 0; i < 27; i++) {
        expect(names.nakshatra(i)).not.toBe(english.nakshatra(i));
      }
    });

    it(`${locale}: differs from English for every graha`, () => {
      for (const graha of GRAHA_ORDER) {
        expect(names.graha(graha)).not.toBe(english.graha(graha));
      }
    });

    it(`${locale}: uses no Latin letters in its own names`, () => {
      const sample = [
        ...Array.from({ length: 12 }, (_, i) => names.rashi(i)),
        ...Array.from({ length: 27 }, (_, i) => names.nakshatra(i)),
        ...GRAHA_ORDER.map((g) => names.graha(g)),
      ].join('');

      expect(sample).not.toMatch(/[A-Za-z]/);
    });
  }
});

describe('distinctness', () => {
  /*
    Two signs sharing a name means a copy and paste slip, and the reader would
    see the same word twice with no way to tell which is which.
  */
  for (const locale of LOCALES) {
    const names = astroNames(locale);

    it(`${locale}: every rashi name is distinct`, () => {
      const all = Array.from({ length: 12 }, (_, i) => names.rashi(i));
      expect(new Set(all).size).toBe(12);
    });

    it(`${locale}: every nakshatra name is distinct`, () => {
      const all = Array.from({ length: 27 }, (_, i) => names.nakshatra(i));
      expect(new Set(all).size).toBe(27);
    });

    it(`${locale}: every graha name is distinct`, () => {
      const all = GRAHA_ORDER.map((g) => names.graha(g));
      expect(new Set(all).size).toBe(GRAHA_ORDER.length);
    });
  }
});

describe('grahaList', () => {
  it('joins in the reader’s own language', () => {
    expect(astroNames('en').grahaList(['Sun', 'Moon'])).toBe('Sun and Moon');
    expect(astroNames('hi').grahaList(['Sun', 'Moon'])).toContain('और');
    expect(astroNames('bn').grahaList(['Sun', 'Moon'])).toContain('এবং');
  });

  it('handles one and none without a stray separator', () => {
    expect(astroNames('en').grahaList(['Sun'])).toBe('Sun');
    expect(astroNames('en').grahaList([])).toBe('');
  });
});
