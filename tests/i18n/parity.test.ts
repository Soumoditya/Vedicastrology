import { describe, expect, it } from 'vitest';

import { DICTIONARIES } from '@/lib/i18n/dictionary';
import { LOCALES } from '@/lib/i18n/locales';

/*
  The standing rule, enforced.

  Every string added from here on ships with its Hindi and Bengali. A missing key
  falls back to English rather than rendering blank, which is the right runtime
  behaviour and exactly why a gap can sit there unnoticed for months: the page
  still works, it just quietly speaks the wrong language. The dictionary was
  complete when this was written — 115 keys in all three locales — and the point
  of this test is to keep it that way.

  It also catches the opposite mistake: a key translated into Hindi and Bengali
  but never added to English, which would make English the language that falls
  back.
*/
describe('the dictionary is complete in every language', () => {
  const english = new Set(Object.keys(DICTIONARIES.en));

  it('has a non-trivial number of keys, so an empty dictionary cannot pass', () => {
    expect(english.size).toBeGreaterThan(100);
  });

  for (const locale of LOCALES) {
    if (locale === 'en') continue;

    it(`${locale} translates every English key`, () => {
      const theirs = new Set(Object.keys(DICTIONARIES[locale]));
      const missing = [...english].filter((key) => !theirs.has(key));
      expect(
        missing,
        `${locale} is missing ${missing.length} key(s). Every string ships with ` +
          `its Hindi and Bengali; see AGENTS.md.`,
      ).toEqual([]);
    });

    it(`${locale} has no key English does not`, () => {
      const theirs = Object.keys(DICTIONARIES[locale]);
      const extra = theirs.filter((key) => !english.has(key));
      expect(
        extra,
        `${locale} carries ${extra.length} key(s) absent from English, which would ` +
          `make English the language that falls back.`,
      ).toEqual([]);
    });

    it(`${locale} leaves no value blank`, () => {
      const blank = Object.entries(DICTIONARIES[locale])
        .filter(([, value]) => !value || !value.trim())
        .map(([key]) => key);
      expect(blank, `blank values fall back to nothing, not to English`).toEqual([]);
    });
  }
});
