import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';

import { getUser, createClient } from '@/lib/supabase/server';
import { astroNames, type AstroNames } from './astro-names';
import { DICTIONARIES } from './dictionary';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './locales';

/**
 * Resolving the language, server side.
 *
 * Order, and the reason for it:
 *
 *   1. A signed-in person's saved setting, because they chose it deliberately
 *      and it should follow them between devices.
 *   2. The cookie, so the switch works with no account at all. Insisting on an
 *      account to read the site in your own language would be absurd.
 *   3. English.
 *
 * The Accept-Language header is deliberately not consulted. A visitor from
 * India very often has a browser set to English while wanting Hindi, and the
 * reverse, so guessing from it gets it wrong confidently. An explicit switch is
 * better than a clever guess.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getUser();

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_settings')
      .select('language')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && isLocale(data.language)) return data.language;
  }

  const store = await cookies();
  const cookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  return DEFAULT_LOCALE;
});

export type Translate = (key: string, fallback?: string) => string;

/**
 * The translator for this request.
 *
 * A missing key falls back to English and then to the key's own fallback
 * argument, never to blank. A half-translated page is usable; a page of empty
 * labels is not, and that is the failure mode a translation system has to
 * refuse.
 */
export const getT = cache(async (): Promise<{ t: Translate; locale: Locale }> => {
  const locale = await getLocale();
  const dictionary = DICTIONARIES[locale];
  const english = DICTIONARIES.en;

  const t: Translate = (key, fallback) =>
    dictionary[key] ?? english[key] ?? fallback ?? key;

  return { t, locale };
});

/**
 * The translator and the astrological vocabulary together.
 *
 * Almost every page that needs one needs the other, and fetching them
 * separately meant resolving the locale twice and, more than once, translating
 * the chrome while leaving the graha names in English. One call returns both,
 * so that cannot drift apart.
 */
export const getNames = cache(
  async (): Promise<{ t: Translate; n: AstroNames; locale: Locale }> => {
    const { t, locale } = await getT();
    return { t, n: astroNames(locale), locale };
  },
);

/**
 * The strings a birth form needs, as a plain record.
 *
 * `BirthForm` is a client component and `getT` is server-only, so the labels have
 * to be handed to it rather than fetched by it — the same arrangement the header
 * already uses for its navigation labels. Gathered in one place so a form never
 * ends up half-translated because a caller forgot a key.
 */
export const getFormLabels = cache(async (): Promise<Record<string, string>> => {
  const { t } = await getT();
  const keys = [
    'form.name',
    'form.optional',
    'form.whoseChart',
    'form.dateOfBirth',
    'form.timeOfBirth',
    'form.clock24',
    'form.timeUnknown',
    'form.timeUnknownNote',
    'form.placeOfBirth',
    'form.placeHint',
    'form.cityOfBirth',
    'form.submitChart',
    'form.genderLegend',
    'form.genderFemale',
    'form.genderMale',
    'form.genderUndisclosed',
    'form.genderNote',
    'form.errDate',
    'form.errPlace',
    'form.errTime',
    'form.errGender',
    'form.calculating',
    'form.searching',
  ];
  return Object.fromEntries(keys.map((key) => [key, t(key)]));
});
