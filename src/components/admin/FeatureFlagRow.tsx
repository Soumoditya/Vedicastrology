'use client';

import { useActionState, useState } from 'react';

import { saveFeatureFlag, type ActionState } from '@/lib/admin/actions';
import type { FeatureFlag, FeatureTier } from '@/lib/supabase/types';

const empty: ActionState = {};

const TIERS: { value: FeatureTier; label: string; note: string }[] = [
  { value: 'free', label: 'Free', note: 'Anyone, no account' },
  { value: 'account', label: 'Account', note: 'Signed in' },
  { value: 'premium', label: 'Membership', note: 'Paying members' },
];

/**
 * One capability, with its tier and its switch.
 *
 * Submits on change rather than behind a save button. There is one decision per
 * row and no way to make an invalid combination, so a save step would only add
 * a way to forget.
 */
export function FeatureFlagRow({ flag }: { flag: FeatureFlag }) {
  const [state, action, pending] = useActionState(saveFeatureFlag, empty);
  const [tier, setTier] = useState<FeatureTier>(flag.tier);
  const [enabled, setEnabled] = useState(flag.enabled);

  return (
    <form
      action={action}
      className="surface-card flex flex-wrap items-center justify-between gap-4 p-4"
      style={{ opacity: enabled ? 1 : 0.55 }}
    >
      <input type="hidden" name="key" value={flag.key} />

      <div className="min-w-[14rem] flex-1">
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {flag.label}
        </p>
        {flag.description && (
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {flag.description}
          </p>
        )}
        {state.error && (
          <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-malefic)' }}>
            {state.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Segmented tier control. Three options that are mutually exclusive
            and permanently visible read faster than a select that hides two
            thirds of the decision. */}
        <div
          className="flex overflow-hidden rounded-full border"
          style={{ borderColor: 'var(--border-subtle)' }}
          role="radiogroup"
          aria-label={`Who can use ${flag.label}`}
        >
          {TIERS.map((option) => {
            const active = tier === option.value;
            return (
              <label
                key={option.value}
                title={option.note}
                className="cursor-pointer px-3 py-1.5 text-xs transition-colors"
                style={{
                  background: active
                    ? 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))'
                    : 'transparent',
                  color: active ? '#150e00' : 'var(--text-secondary)',
                }}
              >
                <input
                  type="radio"
                  name="tier"
                  value={option.value}
                  checked={active}
                  onChange={(e) => {
                    setTier(option.value);
                    e.currentTarget.form?.requestSubmit();
                  }}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              e.currentTarget.form?.requestSubmit();
            }}
          />
          On
        </label>

        <span
          className="w-12 text-right text-[0.65rem]"
          style={{ color: pending ? 'var(--color-gold-400)' : 'transparent' }}
          aria-live="polite"
        >
          {pending ? 'Saving' : 'Saved'}
        </span>
      </div>
    </form>
  );
}
