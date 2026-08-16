'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NAV_LINKS, SITE } from '@/lib/site';
import { Wordmark } from './Wordmark';
import { ThemeToggle } from './ThemeToggle';
import { CurrencySwitcher } from './CurrencySwitcher';
import { AccountLinks, AccountMenu, type AccountState } from './AccountMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import type { Region } from '@/lib/supabase/types';

const SIGNED_OUT: AccountState = { signedIn: false, displayName: null, isAdmin: false };

export function Header({
  regions = [],
  currentRegion = null,
  account = SIGNED_OUT,
  locale = DEFAULT_LOCALE,
  labels = {},
}: {
  regions?: Region[];
  currentRegion?: Region | null;
  account?: AccountState;
  locale?: Locale;
  /** Translated navigation labels, resolved on the server. */
  labels?: Record<string, string>;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header
      className="site-header sticky top-0 z-50 transition-all duration-500"
      style={{
        transitionTimingFunction: 'var(--ease-out-soft)',
        background: scrolled
          ? 'color-mix(in oklab, var(--surface) 82%, transparent)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(1.4)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border-subtle)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem]">
        <Link href="/" aria-label={`${SITE.name} home`} className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3.5 py-2 text-sm transition-colors duration-200"
                style={{ color: active ? 'var(--color-gold-200)' : 'var(--text-secondary)' }}
              >
                {labels[link.href] ?? link.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3.5 -bottom-0.5 h-px"
                    style={{ background: 'var(--color-gold-500)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/*
            Currency and language move into the mobile menu below the small
            breakpoint. Four controls plus a wordmark plus a menu button does not
            fit a 390px phone: adding the language switch pushed the top bar 21px
            past the viewport on an iPhone 13, which scrolled every page sideways.
          */}
          <div className="hidden items-center gap-2 sm:flex">
            <CurrencySwitcher regions={regions} current={currentRegion} />
            <LanguageSwitcher current={locale} />
          </div>
          <ThemeToggle />
          <AccountMenu account={account} labels={labels} />

          <Link
            href="/services"
            className="hidden rounded-full border px-4 py-2 text-xs font-medium
                       tracking-wide transition-all duration-300 sm:inline-block"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--color-gold-200)',
              transitionTimingFunction: 'var(--ease-out-soft)',
            }}
          >
            {labels['nav.book'] ?? 'Book a reading'}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? labels['nav.menuClose'] ?? 'Close menu' : labels['nav.menuOpen'] ?? 'Open menu'}
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-md md:hidden"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className="absolute left-0 block h-px w-5 transition-transform duration-300"
                style={{
                  background: 'currentColor',
                  top: menuOpen ? '7px' : '0',
                  transform: menuOpen ? 'rotate(45deg)' : 'none',
                }}
              />
              <span
                className="absolute left-0 top-[7px] block h-px w-5 transition-opacity duration-200"
                style={{ background: 'currentColor', opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="absolute left-0 block h-px w-5 transition-transform duration-300"
                style={{
                  background: 'currentColor',
                  top: menuOpen ? '7px' : '14px',
                  transform: menuOpen ? 'rotate(-45deg)' : 'none',
                }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-400 md:hidden"
        style={{
          maxHeight: menuOpen ? '32rem' : '0',
          opacity: menuOpen ? 1 : 0,
          transitionTimingFunction: 'var(--ease-out-soft)',
          background: 'color-mix(in oklab, var(--surface) 96%, transparent)',
          backdropFilter: 'blur(14px)',
          borderBottom: menuOpen ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <nav className="mx-auto max-w-6xl px-5 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block border-b py-3 text-sm last:border-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              {labels[link.href] ?? link.label}
            </Link>
          ))}
          <div
            className="flex items-center gap-2 border-b py-3 sm:hidden"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <CurrencySwitcher regions={regions} current={currentRegion} />
            <LanguageSwitcher current={locale} />
          </div>
          <AccountLinks account={account} labels={labels} />
          <Link
            href="/services"
            className="mt-3 block rounded-lg py-3 text-center text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
              color: '#160f00',
            }}
          >
            {labels['nav.book'] ?? 'Book a reading'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
