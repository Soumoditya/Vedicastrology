'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { setResearchConsent, type AccountState } from '@/lib/account/actions';

const empty: AccountState = {};

/**
 * The research opt-in, and the questions that follow from it.
 *
 * The previous arrangement was a checkbox and a separate "Save preference"
 * button, and it went wrong in three ways at once. The box was uncontrolled, so
 * it showed the server's answer and then drifted from it. Pressing Save without
 * touching the box submitted whatever it happened to hold, which is how you can
 * press a button you did not mean to and be told your contribution has been
 * deleted. And the optional questions below sat behind a separate fold that had
 * to be opened by hand, so ticking the box appeared to do nothing.
 *
 * Now it is one control. Ticking saves immediately — a preference toggle that
 * needs a second confirming click is a toggle that leaves you unsure whether it
 * took — and the questions appear with it, because consenting and then being
 * asked to go looking for the form is a strange way to treat somebody who just
 * said yes.
 */
export function ResearchConsentForm({
  consent,
  strings,
  children,
}: {
  consent: boolean;
  strings: { label: string; save: string; saving: string };
  /** The optional life-event questions, revealed once consent is given. */
  children?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(setResearchConsent, empty);
  const [checked, setChecked] = useState(consent);
  const form = useRef<HTMLFormElement>(null);

  // The server is the authority: if a save resolves to something else, follow it.
  useEffect(() => setChecked(consent), [consent]);

  return (
    <form ref={form} action={action} className="mt-5 space-y-4">
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="consent"
          checked={checked}
          disabled={pending}
          onChange={(e) => {
            setChecked(e.target.checked);
            // Submit the change itself rather than making it wait for a button.
            form.current?.requestSubmit();
          }}
          className="h-4 w-4 accent-[var(--color-gold-500)]"
        />
        <span style={{ color: 'var(--text-secondary)' }}>{strings.label}</span>
        {pending && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {strings.saving}
          </span>
        )}
      </label>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-malefic)' }}>
          {state.error}
        </p>
      )}
      {state.message && !pending && (
        <p role="status" className="text-sm" style={{ color: 'var(--color-benefic)' }}>
          {state.message}
        </p>
      )}

      {/*
        Revealed by the same state that saved it, so saying yes and being asked
        the follow-up questions are one motion rather than two.
      */}
      {checked && children}
    </form>
  );
}
