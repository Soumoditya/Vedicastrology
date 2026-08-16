'use client';

import { useActionState, useState } from 'react';

import { saveRegion, type ActionState } from '@/lib/admin/actions';
import type { Region } from '@/lib/supabase/types';

const empty: ActionState = {};

/**
 * Add or edit a pricing region.
 *
 * This is the screen that keeps pricing out of the code. A new market, the
 * UK, the Gulf, Australia, is a row here, not a deployment.
 */
export function RegionEditor({ region }: { region?: Region }) {
  const [state, action, pending] = useActionState(saveRegion, empty);
  const [open, setOpen] = useState(!region);

  if (region && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs underline underline-offset-4"
        style={{ color: 'var(--color-gold-400)' }}
      >
        Edit
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-4">
      {region && <input type="hidden" name="id" value={region.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Region name" htmlFor={`name-${region?.id ?? 'new'}`}>
          <input
            id={`name-${region?.id ?? 'new'}`}
            name="name"
            required
            defaultValue={region?.name ?? ''}
            placeholder="United Kingdom"
            className={input}
          />
        </Field>

        <Field
          label="Short code"
          htmlFor={`code-${region?.id ?? 'new'}`}
          hint="Your own label"
        >
          <input
            id={`code-${region?.id ?? 'new'}`}
            name="code"
            required
            defaultValue={region?.code ?? ''}
            placeholder="UK"
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Currency code"
          htmlFor={`currency-${region?.id ?? 'new'}`}
          hint="Three letters"
        >
          <input
            id={`currency-${region?.id ?? 'new'}`}
            name="currency"
            required
            maxLength={3}
            defaultValue={region?.currency ?? ''}
            placeholder="GBP"
            className={input}
          />
        </Field>

        <Field label="Symbol" htmlFor={`symbol-${region?.id ?? 'new'}`}>
          <input
            id={`symbol-${region?.id ?? 'new'}`}
            name="symbol"
            required
            maxLength={4}
            defaultValue={region?.symbol ?? ''}
            placeholder="£"
            className={input}
          />
        </Field>
      </div>

      <Field
        label="Countries in this region"
        htmlFor={`countries-${region?.id ?? 'new'}`}
        hint="Two-letter codes"
      >
        <textarea
          id={`countries-${region?.id ?? 'new'}`}
          name="country_codes"
          rows={2}
          defaultValue={(region?.country_codes ?? []).join(', ')}
          placeholder="GB, IE"
          className={input}
        />
        <p className="mt-1.5 text-[0.7rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Separate them however you like, commas, spaces or new lines all work.
          Leave this empty to make the region a catch-all for everyone whose
          country isn’t listed anywhere else.
        </p>
      </Field>

      <div className="flex flex-wrap items-center gap-5">
        <Field label="Order" htmlFor={`order-${region?.id ?? 'new'}`}>
          <input
            id={`order-${region?.id ?? 'new'}`}
            name="sort_order"
            type="number"
            defaultValue={region?.sort_order ?? 0}
            className={`${input} w-24`}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={region?.is_default ?? false}
            className="h-4 w-4 accent-[var(--color-gold-500)]"
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            Use as the fallback region
          </span>
        </label>
      </div>

      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="ok">{state.message}</Alert>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-70"
          style={{
            background:
              'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
            color: '#160f00',
          }}
        >
          {pending ? 'Saving…' : region ? 'Save region' : 'Add region'}
        </button>

        {region && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        )}
      </div>
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

function Alert({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const color = tone === 'error' ? 'var(--color-malefic)' : 'var(--color-benefic)';
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className="rounded-lg border px-3 py-2 text-sm"
      style={{
        borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
        background: `color-mix(in oklab, ${color} 8%, transparent)`,
        color,
      }}
    >
      {children}
    </p>
  );
}
