/**
 * Locales.
 *
 * Three languages, and a deliberate decision about what a language switch
 * actually means here.
 *
 * The interface, the astrological vocabulary and the explanatory writing are
 * translated. Blog posts are not: machine translating somebody's own writing
 * produces worse prose than leaving it, and the point of the switch is that the
 * site is usable, not that the voice is duplicated. A post stays in whichever
 * language it was written in.
 *
 * Generated readings are handled separately again: they are written directly in
 * the reader's language by the narration layer rather than translated after the
 * fact, which reads better and costs the same.
 */

export const LOCALES = ['en', 'hi', 'bn'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
};

/** The cookie a signed-out visitor's choice lives in. */
export const LOCALE_COOKIE = 'lang';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * The `lang` attribute for the document.
 *
 * Not cosmetic: it drives hyphenation, the font stack, and how a screen reader
 * pronounces the page. Devanagari read aloud by an English voice is unusable.
 */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  hi: 'hi',
  bn: 'bn',
};
