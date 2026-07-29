'use client';

import { useActionState } from 'react';

import { saveService, saveServicePrices, type ActionState } from '@/lib/admin/actions';
import type { Region, Service, ServicePrice } from '@/lib/supabase/types';

const empty: ActionState = {};

export function ServiceEditor({
  service,
  regions,
  prices,
}: {
  service: Service | null;
  regions: Region[];
  prices: ServicePrice[];
}) {
  const [state, action, pending] = useActionState(saveService, empty);

  return (
    <>
      <form action={action} className="space-y-5">
        {service && <input type="hidden" name="id" value={service.id} />}

        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            defaultValue={service?.title ?? ''}
            placeholder="Full chart reading"
            className={input}
          />
        </Field>

        <Field
          label="Web address"
          htmlFor="slug"
          hint="Leave blank to build it from the title"
        >
          <input
            id="slug"
            name="slug"
            defaultValue={service?.slug ?? ''}
            placeholder="full-chart-reading"
            className={input}
          />
        </Field>

        <Field label="Short summary" htmlFor="summary" hint="Shown on the services list">
          <textarea
            id="summary"
            name="summary"
            rows={2}
            defaultValue={service?.summary ?? ''}
            placeholder="A complete reading of your birth chart, covering…"
            className={input}
          />
        </Field>

        <Field label="Full description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={8}
            defaultValue={service?.description ?? ''}
            placeholder="What this reading covers, how it works, what you will receive…"
            className={input}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Length" htmlFor="duration_minutes" hint="Minutes">
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={1}
              defaultValue={service?.duration_minutes ?? ''}
              placeholder="60"
              className={input}
            />
          </Field>

          <Field label="Order" htmlFor="sort_order" hint="Lower shows first">
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={service?.sort_order ?? 0}
              className={input}
            />
          </Field>
        </div>

        <Field label="What they receive" htmlFor="deliverables" hint="One per line">
          <textarea
            id="deliverables"
            name="deliverables"
            rows={4}
            defaultValue={(service?.deliverables ?? []).join('\n')}
            placeholder={'A 60 minute call\nYour full chart as a PDF\nA recording of the session'}
            className={input}
          />
        </Field>

        <div className="flex flex-wrap gap-5">
          <Toggle
            name="is_active"
            label="Visible on the site"
            defaultChecked={service?.is_active ?? true}
          />
          <Toggle
            name="is_featured"
            label="Feature on the home page"
            defaultChecked={service?.is_featured ?? false}
          />
        </div>

        {state.error && <Alert tone="error">{state.error}</Alert>}

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? 'Saving…' : service ? 'Save changes' : 'Create service'}
        </button>
      </form>

      {/*
        Prices live in their own form so they save independently of the copy
        above, editing a price should not require re-submitting the whole
        description, and vice versa. Nested forms are invalid HTML, so these
        are siblings.
      */}
      {service && <PriceGrid serviceId={service.id} regions={regions} prices={prices} />}
    </>
  );
}

/**
 * The price grid.
 *
 * One box per region, filled in by hand. There is deliberately no currency
 * conversion: what you charge in a market is a commercial decision, not an
 * exchange rate, and a converted figure produces awkward numbers that undercut
 * the price you meant to set.
 */
function PriceGrid({
  serviceId,
  regions,
  prices,
}: {
  serviceId: string;
  regions: Region[];
  prices: ServicePrice[];
}) {
  const [state, action, pending] = useActionState(saveServicePrices, empty);
  const byRegion = new Map(prices.map((p) => [p.region_id, p]));

  return (
    <form action={action} className="surface-card mt-8 p-5">
      <input type="hidden" name="service_id" value={serviceId} />

      <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
        Price in each region
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Leave a box empty to not sell this service in that region, visitors
        there see your default region’s price instead. Nothing is converted:
        each figure is exactly what you type.
      </p>

      <div className="mt-5 space-y-4">
        {regions.map((region) => {
          const existing = byRegion.get(region.id);
          return (
            <div key={region.id} className="grid gap-3 sm:grid-cols-[10rem_1fr_1fr]">
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--text-primary)' }}>{region.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {region.currency}
                </span>
                {region.is_default && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider"
                    style={{
                      background:
                        'color-mix(in oklab, var(--color-gold-500) 14%, transparent)',
                      color: 'var(--color-gold-300)',
                    }}
                  >
                    Default
                  </span>
                )}
              </div>

              <label className="relative block">
                <span className="sr-only">Price in {region.name}</span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {region.symbol}
                </span>
                <input
                  name={`price_${region.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={existing?.amount ?? ''}
                  placeholder="Price"
                  className={`${input} pl-8`}
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Previous price in {region.name}</span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {region.symbol}
                </span>
                <input
                  name={`compare_${region.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={existing?.compare_at ?? ''}
                  placeholder="Was (optional)"
                  className={`${input} pl-8`}
                />
              </label>
            </div>
          );
        })}
      </div>

      {state.error && (
        <div className="mt-4">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {state.message && (
        <div className="mt-4">
          <Alert tone="ok">{state.message}</Alert>
        </div>
      )}

      <button type="submit" disabled={pending} className={`${primaryButton} mt-5`}>
        {pending ? 'Saving prices…' : 'Save prices'}
      </button>
    </form>
  );
}

const input =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)]';

const primaryButton =
  'rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-70 ' +
  'bg-[linear-gradient(135deg,var(--color-gold-500),var(--color-gold-600))] text-[#160f00]';

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

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[var(--color-gold-500)]"
      />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </label>
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
