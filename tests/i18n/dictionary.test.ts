import { describe, expect, it } from 'vitest';

import { DICTIONARIES, KEYS } from '@/lib/i18n/dictionary';
import { LOCALES, LOCALE_NAMES, HTML_LANG, isLocale } from '@/lib/i18n/locales';

describe('locales', () => {
  it('names every locale in its own script', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      expect(HTML_LANG[locale]).toBeTruthy();
    }
    // Written in their own script, not transliterated, because that is what
    // somebody looking for their language actually scans for.
    expect(LOCALE_NAMES.hi).toMatch(/[ऀ-ॿ]/);
    expect(LOCALE_NAMES.bn).toMatch(/[ঀ-৿]/);
  });

  it('rejects anything that is not a known locale', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale('EN')).toBe(false);
  });
});

describe('dictionary', () => {
  it('has no duplicate or empty English keys', () => {
    expect(new Set(KEYS).size).toBe(KEYS.length);
    for (const key of KEYS) {
      expect(DICTIONARIES.en[key], key).toBeTruthy();
    }
  });

  /*
    Not asserting that every key is translated. A missing one falls back to
    English, which is the point, and demanding completeness would mean either a
    permanently failing test or filler translations.

    What is asserted is that every key a translation does define exists in
    English, which catches the real mistake: a typo in a translated key, which
    would silently never be used and never be noticed.
  */
  it('defines no translated key that English does not have', () => {
    const english = new Set(KEYS);
    for (const locale of ['hi', 'bn'] as const) {
      for (const key of Object.keys(DICTIONARIES[locale])) {
        expect(english.has(key), `${locale} defines unknown key ${key}`).toBe(true);
      }
    }
  });

  it('translates the surfaces a visitor sees first', () => {
    // Navigation, the tools index and the gates. Somebody switching language
    // and still seeing English chrome would reasonably think it had not worked.
    const critical = KEYS.filter(
      (k) => k.startsWith('nav.') || k.startsWith('tools.') || k.startsWith('gate.'),
    );

    for (const locale of ['hi', 'bn'] as const) {
      const missing = critical.filter((k) => !DICTIONARIES[locale][k]);
      expect(missing, `${locale} missing: ${missing.join(', ')}`).toHaveLength(0);
    }
  });

  it('writes each translation in the right script', () => {
    const devanagari = /[ऀ-ॿ]/;
    const bengali = /[ঀ-৿]/;

    // Sampled on prose keys. Short labels can legitimately be a Latin acronym,
    // PDF for instance, so those are not a useful check.
    for (const key of ['nav.services', 'tools.heading', 'gate.needsPremium']) {
      expect(DICTIONARIES.hi[key], `hi ${key}`).toMatch(devanagari);
      expect(DICTIONARIES.bn[key], `bn ${key}`).toMatch(bengali);
    }
  });
});
