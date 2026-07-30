'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locales';
import { setLocale } from '@/lib/i18n/actions';

/**
 * The language switch.
 *
 * Works signed out, which is the point: nobody should have to make an account
 * to read the site in their own language. The choice is written to a cookie, and
 * also to the account's settings when there is one, so it follows the person to
 * their next device.
 *
 * Each language is written in its own script. "Hindi" in Latin letters is less
 * recognisable to somebody looking for Hindi than हिन्दी is.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setLocale(locale);
      // The whole tree is translated on the server, so the page has to come
      // back from it rather than being patched in the browser.
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Language"
        disabled={pending}
        className="rounded-full border px-2.5 py-1.5 text-xs disabled:opacity-60"
        style={{
          borderColor: open ? 'var(--color-gold-500)' : 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        {LOCALE_NAMES[current]}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border py-1"
          style={{
            background: 'color-mix(in oklab, var(--surface-raised) 97%, transparent)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 18px 40px -18px rgba(0, 0, 0, 0.7)',
          }}
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="menuitem"
              onClick={() => choose(locale)}
              className="block w-full px-3.5 py-2 text-left text-sm"
              style={{
                color:
                  locale === current ? 'var(--color-gold-300)' : 'var(--text-secondary)',
              }}
            >
              {LOCALE_NAMES[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
