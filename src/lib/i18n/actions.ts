'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { isLocale, LOCALE_COOKIE, type Locale } from './locales';

/**
 * Choose a language.
 *
 * Written to a cookie always, and to the account's settings as well when there
 * is one. Both, not either: the cookie makes it work for a visitor with no
 * account, and the setting makes it follow somebody to their next device.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    // A year. This is a preference, not a session.
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Upserted, since somebody who has never opened the settings page has no
    // row yet and choosing a language should not require creating one first.
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, language: locale }, { onConflict: 'user_id' });
  }

  // Every page reads the locale, so the whole tree has to be reconsidered.
  revalidatePath('/', 'layout');
}
