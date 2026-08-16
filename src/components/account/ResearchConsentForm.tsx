'use client';

import { useActionState } from 'react';

import { setResearchConsent, type AccountState } from '@/lib/account/actions';

const empty: AccountState = {};

/**
 * The research opt-in toggle.
 *
 * A client component purely so the result of the write can be shown. As a raw
 * form action this had no way to report anything, so when the write was being
 * refused the checkbox simply reverted and the person was left guessing. A
 * consent control that cannot say whether consent was recorded is not a
 * consent control.
 */
export function ResearchConsentForm({
  consent,
  strings,
}: {
  consent: boolean;
  strings: { label: string; save: string; saving: string };
}) {
  const [state, action, pending] = useActionState(setResearchConsent, empty);

  return (
    <form action={action} className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={consent}
            className="h-4 w-4 accent-[var(--color-gold-500)]"
          />
          <span style={{ color: 'var(--text-secondary)' }}>{strings.label}</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border px-4 py-2 text-xs disabled:opacity-70"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
        >
          {pending ? strings.saving : strings.save}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-malefic)' }}>
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm" style={{ color: 'var(--color-benefic)' }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
