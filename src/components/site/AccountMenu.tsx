'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { signOut } from '@/lib/auth/actions';

export interface AccountState {
  signedIn: boolean;
  displayName: string | null;
  isAdmin: boolean;
}

/**
 * Who you are, and where you can go.
 *
 * The header had none of this. Somebody could sign up, land back on the home
 * page and have no route to their own charts, their settings, or, if they were
 * the administrator, to the admin panel. Being signed in was invisible, which
 * makes an account feel like it did not work.
 *
 * On a phone this lives in the mobile menu instead, because a dropdown inside a
 * dropdown is worse than a plain list.
 */
export function AccountMenu({
  account,
  labels = {},
}: {
  account: AccountState;
  /** Translated, resolved on the server. Falls back to English. */
  labels?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const label = (key: string, fallback: string) => labels[key] ?? fallback;
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!account.signedIn) {
    return (
      <Link
        href="/login"
        className="hidden rounded-full px-3.5 py-2 text-xs font-medium transition-colors duration-200 sm:inline-block"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label('nav.signIn', 'Sign in')}
      </Link>
    );
  }

  // The first initial, which is enough to show the session is real without
  // putting a name in the header on a shared screen.
  const initial = (account.displayName ?? 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="relative hidden sm:block" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label('nav.account', 'Your account')}
        className="grid h-8 w-8 place-items-center rounded-full border text-xs font-medium transition-colors duration-200"
        style={{
          borderColor: open ? 'var(--color-gold-500)' : 'var(--border-strong)',
          color: 'var(--color-gold-200)',
          background: 'color-mix(in oklab, var(--color-gold-500) 10%, transparent)',
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border py-1.5"
          style={{
            background: 'color-mix(in oklab, var(--surface-raised) 97%, transparent)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 18px 40px -18px rgba(0, 0, 0, 0.7)',
          }}
        >
          {account.displayName && (
            <p
              className="truncate border-b px-3.5 pb-2 pt-1 text-xs"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
            >
              {account.displayName}
            </p>
          )}

          <MenuLink href="/dashboard">{label('nav.charts', 'Your charts')}</MenuLink>
          <MenuLink href="/dashboard/settings">{label('nav.settings', 'Settings')}</MenuLink>

          {account.isAdmin && (
            <>
              <div className="my-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              <MenuLink href="/admin" accent>
                {label('nav.admin', 'Admin panel')}
              </MenuLink>
            </>
          )}

          <div className="my-1 h-px" style={{ background: 'var(--border-subtle)' }} />

          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3.5 py-2 text-left text-sm transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label('nav.signOut', 'Sign out')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="block px-3.5 py-2 text-sm transition-colors duration-150"
      style={{ color: accent ? 'var(--color-gold-300)' : 'var(--text-secondary)' }}
    >
      {children}
    </Link>
  );
}

/** The same destinations as a plain list, for the mobile menu. */
export function AccountLinks({
  account,
  labels = {},
}: {
  account: AccountState;
  labels?: Record<string, string>;
}) {
  const label = (key: string, fallback: string) => labels[key] ?? fallback;

  if (!account.signedIn) {
    return (
      <Link
        href="/login"
        className="block border-b py-3 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label('nav.signInLong', 'Sign in or create an account')}
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="block border-b py-3 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label('nav.charts', 'Your charts')}
      </Link>
      <Link
        href="/dashboard/settings"
        className="block border-b py-3 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label('nav.settings', 'Settings')}
      </Link>
      {account.isAdmin && (
        <Link
          href="/admin"
          className="block border-b py-3 text-sm"
          style={{ color: 'var(--color-gold-300)' }}
        >
          {label('nav.admin', 'Admin panel')}
        </Link>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="block w-full border-b py-3 text-left text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {label('nav.signOut', 'Sign out')}
        </button>
      </form>
    </>
  );
}
