'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import {
  signIn,
  signInWithMagicLink,
  signUp,
  type AuthState,
} from '@/lib/auth/actions';

type Mode = 'signin' | 'signup';

const initial: AuthState = {};

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const [magicLink, setMagicLink] = useState(false);

  const action = magicLink ? signInWithMagicLink : mode === 'signup' ? signUp : signIn;
  const [state, formAction, pending] = useActionState(action, initial);

  const heading = mode === 'signup' ? 'Create an account' : 'Welcome back';
  const blurb =
    mode === 'signup'
      ? 'Save your charts, keep family and client charts together, and follow your dasha as it turns.'
      : 'Sign in to reach your saved charts and your dashboard.';

  return (
    <div className="surface-card p-6 sm:p-8">
      <h1
        className="font-display text-2xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {heading}
      </h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {blurb}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        {mode === 'signup' && !magicLink && (
          <Field label="Name" htmlFor="display_name" hint="Optional">
            <input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              className={inputClass}
              placeholder="What should I call you?"
            />
          </Field>
        )}

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>

        {!magicLink && (
          <Field
            label="Password"
            htmlFor="password"
            hint={mode === 'signup' ? 'At least 8 characters' : undefined}
          >
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
        )}

        {state.error && (
          <p
            role="alert"
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'color-mix(in oklab, var(--color-malefic) 40%, transparent)',
              background: 'color-mix(in oklab, var(--color-malefic) 8%, transparent)',
              color: 'var(--color-malefic)',
            }}
          >
            {state.error}
          </p>
        )}

        {state.message && (
          <p
            role="status"
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'color-mix(in oklab, var(--color-benefic) 40%, transparent)',
              background: 'color-mix(in oklab, var(--color-benefic) 8%, transparent)',
              color: 'var(--color-benefic)',
            }}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-6 py-3 text-sm font-medium transition-opacity disabled:cursor-wait disabled:opacity-70"
          style={{
            background:
              'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
            color: '#160f00',
          }}
        >
          {pending
            ? 'One moment…'
            : magicLink
              ? 'Email me a sign-in link'
              : mode === 'signup'
                ? 'Create account'
                : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMagicLink((v) => !v)}
        className="mt-4 w-full text-center text-xs underline underline-offset-4"
        style={{ color: 'var(--text-muted)' }}
      >
        {magicLink
          ? 'Use a password instead'
          : 'Rather not use a password? Email me a link'}
      </button>

      <div className="rule-gold my-6" />

      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-gold-300)' }}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" style={{ color: 'var(--color-gold-300)' }}>
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)]';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
