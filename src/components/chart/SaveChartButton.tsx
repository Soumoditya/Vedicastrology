'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { saveBirthProfile, type AccountState } from '@/lib/account/actions';

const empty: AccountState = {};

export interface SaveChartButtonProps {
  signedIn: boolean;
  defaultLabel: string;
  birth: {
    date: string;
    time: string;
    timeUnknown: boolean;
    timezone: string;
    placeName: string;
    latitude: number;
    longitude: number;
    /** Carried through so a saved chart knows it, for comparing two charts. */
    gender?: string;
  };
}

/**
 * Save the chart currently on screen to the visitor's account.
 *
 * Signed out, this is an invitation rather than a wall: the chart is already
 * visible and stays visible. Making people sign in to see their own chart
 * would be the wrong trade for a tool meant to be freely useful.
 */
export function SaveChartButton({ signedIn, defaultLabel, birth }: SaveChartButtonProps) {
  const [state, action, pending] = useActionState(saveBirthProfile, empty);
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <div
        className="surface-card flex flex-wrap items-center justify-between gap-4 p-5"
      >
        <div>
          <p className="font-display text-base" style={{ color: 'var(--color-gold-200)' }}>
            Keep this chart
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            With an account it is here whenever you come back, along with the
            dasha you are running.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-full px-5 py-2.5 text-sm font-medium"
            style={{
              background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
              color: '#150e00',
            }}
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="rounded-full border px-5 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (state.message) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-benefic) 40%, transparent)',
          background: 'color-mix(in oklab, var(--color-benefic) 7%, transparent)',
          color: 'var(--color-benefic)',
        }}
      >
        {state.message}{' '}
        <Link href="/dashboard" className="underline underline-offset-4">
          See your saved charts
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border px-5 py-2.5 text-sm"
        style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
      >
        Save to my account
      </button>
    );
  }

  return (
    <form action={action} className="surface-card space-y-4 p-5">
      <input type="hidden" name="birth_date" value={birth.date} />
      <input type="hidden" name="birth_time" value={birth.time} />
      {birth.timeUnknown && <input type="hidden" name="time_unknown" value="on" />}
      <input type="hidden" name="timezone" value={birth.timezone} />
      <input type="hidden" name="place_name" value={birth.placeName} />
      <input type="hidden" name="latitude" value={birth.latitude} />
      <input type="hidden" name="longitude" value={birth.longitude} />
      {birth.gender && <input type="hidden" name="gender" value={birth.gender} />}

      <div>
        <label
          htmlFor="save-label"
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Name this chart
        </label>
        <input
          id="save-label"
          name="label"
          required
          defaultValue={defaultLabel}
          placeholder="My chart"
          className="w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label
          htmlFor="save-notes"
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Notes
        </label>
        <textarea
          id="save-notes"
          name="notes"
          rows={2}
          placeholder="Anything you want to remember about this chart."
          className="w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-malefic)' }}>
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-70"
          style={{
            background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
            color: '#150e00',
          }}
        >
          {pending ? 'Saving…' : 'Save chart'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
