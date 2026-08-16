'use client';

import { useActionState, useState } from 'react';

import { reviewReading, type ActionState } from '@/lib/admin/actions';
import type { Reading } from '@/lib/supabase/types';
import type { Signal } from '@/lib/predictions/signals';

const empty: ActionState = {};

/**
 * One reading, with everything needed to judge it.
 *
 * The prose is editable in place, the findings it was written from are shown
 * beside it, and any safety rule that fired is quoted with the sentence that
 * tripped it. Approving without being able to see the source findings would be
 * rubber stamping, which is not review.
 */
export function ReadingReview({ reading }: { reading: Reading }) {
  const [state, action, pending] = useActionState(reviewReading, empty);
  const [body, setBody] = useState(reading.body ?? '');
  const [showSignals, setShowSignals] = useState(false);

  const signals = ((reading.signals as { signals?: Signal[] } | null)?.signals ?? []).slice(0, 12);
  const blocked = reading.safety_findings.some((f) => f.severity === 'block');

  return (
    <article className="surface-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-gold-600)' }}>
            {reading.period} · {reading.period_start} to {reading.period_end}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {reading.model ?? 'unknown model'}
            {reading.edited && ' · edited'}
          </p>
        </div>

        {reading.safety_findings.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]"
            style={{
              background: blocked
                ? 'color-mix(in oklab, var(--color-malefic) 18%, transparent)'
                : 'color-mix(in oklab, var(--color-gold-500) 16%, transparent)',
              color: blocked ? 'var(--color-malefic)' : 'var(--color-gold-300)',
            }}
          >
            {blocked ? 'Blocked' : 'Flagged'}
          </span>
        )}
      </div>

      {/* Safety findings first. If the filter objected, that is the thing to
          read before the prose, not after it. */}
      {reading.safety_findings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {reading.safety_findings.map((finding, i) => (
            <li
              key={`${finding.id}-${i}`}
              className="rounded-lg border-l-2 py-2 pl-3 pr-2 text-xs leading-relaxed"
              style={{
                borderColor: finding.severity === 'block' ? 'var(--color-malefic)' : 'var(--color-gold-600)',
                background: 'color-mix(in oklab, var(--color-malefic) 5%, transparent)',
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{finding.reason}</span>
              {finding.excerpt && (
                <span className="mt-1 block italic" style={{ color: 'var(--text-muted)' }}>
                  {finding.excerpt}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-4">
        <input type="hidden" name="id" value={reading.id} />

        <label
          htmlFor={`body-${reading.id}`}
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          The reading
        </label>
        <textarea
          id={`body-${reading.id}`}
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="mt-1.5 w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        />

        <label
          htmlFor={`note-${reading.id}`}
          className="mt-3 block text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Note to yourself
        </label>
        <input
          id={`note-${reading.id}`}
          name="note"
          defaultValue={reading.review_note ?? ''}
          placeholder="Why you changed it, if you did"
          className="mt-1.5 w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2 text-sm"
          style={{ color: 'var(--text-primary)' }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="decision"
            value="publish"
            disabled={pending}
            className="rounded-full px-5 py-2 text-sm font-medium disabled:opacity-60"
            style={{
              background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
              color: '#150e00',
            }}
          >
            {pending ? 'Saving…' : 'Publish'}
          </button>

          <button
            type="submit"
            name="decision"
            value="reject"
            disabled={pending}
            className="rounded-full border px-5 py-2 text-sm disabled:opacity-60"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Reject
          </button>

          <button
            type="button"
            onClick={() => setShowSignals((v) => !v)}
            className="text-xs underline underline-offset-4"
            style={{ color: 'var(--color-gold-400)' }}
          >
            {showSignals ? 'Hide the findings' : `Findings it was written from (${signals.length})`}
          </button>

          {state.message && (
            <span className="text-xs" style={{ color: 'var(--color-benefic)' }} role="status">
              {state.message}
            </span>
          )}
          {state.error && (
            <span className="text-xs" style={{ color: 'var(--color-malefic)' }} role="alert">
              {state.error}
            </span>
          )}
        </div>
      </form>

      {showSignals && (
        <ol className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          {signals.map((signal, i) => (
            <li key={`${signal.code}-${i}`} className="text-xs leading-relaxed">
              <span style={{ color: 'var(--text-primary)' }}>{signal.statement}</span>
              <span className="block" style={{ color: 'var(--text-muted)' }}>
                {signal.rule}
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
