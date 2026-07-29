'use client';

import { useActionState, useState } from 'react';

import { submitTestimonial, type TestimonialState } from '@/lib/testimonials/actions';

const empty: TestimonialState = {};

export function TestimonialForm() {
  const [state, action, pending] = useActionState(submitTestimonial, empty);
  const [rating, setRating] = useState(5);

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
          Received
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="rating" value={rating} />

      <fieldset>
        <legend
          className="mb-2 text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Rating
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} out of 5`}
              aria-pressed={rating === star}
              className="text-2xl leading-none transition-transform duration-200 hover:scale-110"
              style={{ color: star <= rating ? 'var(--color-gold-400)' : 'var(--border-subtle)' }}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name to publish" htmlFor="t-name">
          <input id="t-name" name="author_name" required className={input} />
        </Field>
        <Field label="Where you are" htmlFor="t-loc" hint="Optional">
          <input id="t-loc" name="author_location" placeholder="Kolkata" className={input} />
        </Field>
      </div>

      <Field label="What was it like?" htmlFor="t-body">
        <textarea
          id="t-body"
          name="body"
          rows={5}
          required
          minLength={20}
          placeholder="What you came with, and what you took away."
          className={input}
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-malefic)' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full px-6 py-3 text-sm font-medium disabled:opacity-70"
        style={{
          background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
          color: '#150e00',
        }}
      >
        {pending ? 'Sending…' : 'Send'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Read before publishing, and never edited.
      </p>
    </form>
  );
}

const input =
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
