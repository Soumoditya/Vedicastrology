'use client';

import { useActionState, useState } from 'react';

import { submitEnquiry, type EnquiryState } from '@/lib/enquiries/actions';

const empty: EnquiryState = {};

export interface EnquiryFormProps {
  serviceId?: string;
  serviceTitle?: string;
}

/**
 * Enquiry form.
 *
 * Birth details are collapsed behind a toggle rather than shown up front.
 * Asking for them immediately reads as a form to fill in; asking for a name,
 * an email and a sentence reads as sending a message, and far more people
 * finish that.
 */
export function EnquiryForm({ serviceId, serviceTitle }: EnquiryFormProps) {
  const [state, action, pending] = useActionState(submitEnquiry, empty);
  const [showBirth, setShowBirth] = useState(false);

  if (state.message) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-benefic) 40%, transparent)',
          background: 'color-mix(in oklab, var(--color-benefic) 7%, transparent)',
        }}
      >
        <p className="font-display text-lg" style={{ color: 'var(--color-benefic)' }}>
          Message sent
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {serviceId && <input type="hidden" name="service_id" value={serviceId} />}

      {serviceTitle && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Enquiring about <span style={{ color: 'var(--color-gold-300)' }}>{serviceTitle}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="enq-name">
          <input id="enq-name" name="name" required autoComplete="name" className={input} />
        </Field>

        <Field label="Email" htmlFor="enq-email">
          <input
            id="enq-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={input}
          />
        </Field>
      </div>

      <Field label="Phone or WhatsApp" htmlFor="enq-phone" hint="Optional">
        <input id="enq-phone" name="phone" type="tel" autoComplete="tel" className={input} />
      </Field>

      <Field label="What are you looking for?" htmlFor="enq-message">
        <textarea
          id="enq-message"
          name="message"
          rows={5}
          required
          placeholder="A sentence or two is plenty. What is on your mind, or what you would like read."
          className={input}
        />
      </Field>

      <div>
        <button
          type="button"
          onClick={() => setShowBirth((v) => !v)}
          aria-expanded={showBirth}
          className="text-xs underline underline-offset-4"
          style={{ color: 'var(--color-gold-400)' }}
        >
          {showBirth ? 'Hide birth details' : 'Add your birth details now (optional)'}
        </button>

        {showBirth && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Date" htmlFor="enq-bdate">
              <input id="enq-bdate" name="birth_date" type="date" className={input} />
            </Field>
            <Field label="Time" htmlFor="enq-btime">
              <input id="enq-btime" name="birth_time" type="time" className={input} />
            </Field>
            <Field label="Place" htmlFor="enq-bplace">
              <input id="enq-bplace" name="birth_place" placeholder="City" className={input} />
            </Field>
          </div>
        )}
      </div>

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

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full px-6 py-3.5 text-sm font-medium disabled:opacity-70"
        style={{
          background:
            'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500) 55%, var(--color-gold-400))',
          color: '#150e00',
        }}
      >
        {pending ? 'Sending…' : 'Send enquiry'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        No account needed. Your details are not shared with anyone.
      </p>
    </form>
  );
}

const input =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)] [color-scheme:dark]';

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
