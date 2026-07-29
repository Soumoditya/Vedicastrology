'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PlaceResult } from '@/lib/geo/geocode';
import { toBirthQueryString } from '@/lib/astro/query';

export interface BirthFormProps {
  /** Where to send the visitor once details are entered. */
  action: string;
  submitLabel?: string;
  /** Pre-fill from an existing chart, when refining a result. */
  initial?: Partial<BirthFormValues>;
  /** Ask for a name — used on saved charts, skipped on quick tools. */
  askName?: boolean;
  compact?: boolean;
}

export interface BirthFormValues {
  name: string;
  date: string;
  time: string;
  timeUnknown: boolean;
  place: PlaceResult | null;
}

export function BirthForm({
  action,
  submitLabel = 'Cast the chart',
  initial,
  askName = true,
  compact = false,
}: BirthFormProps) {
  const router = useRouter();
  const uid = useId().replace(/:/g, '');

  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [timeUnknown, setTimeUnknown] = useState(initial?.timeUnknown ?? false);
  const [place, setPlace] = useState<PlaceResult | null>(initial?.place ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) return setError('Please enter the date of birth.');
    if (!place) return setError('Please choose the place of birth from the list.');
    if (!timeUnknown && !time) {
      return setError(
        'Please enter the time of birth, or tick “I don’t know the time”.',
      );
    }

    setSubmitting(true);

    const query = toBirthQueryString({
      date,
      // With no known time the chart is cast for noon and flagged throughout,
      // so nothing that depends on the ascendant is presented as certain.
      time: timeUnknown ? '12:00' : time,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
      place: place.label,
      name: name || undefined,
      timeUnknown,
    });

    router.push(`${action}?${query}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'space-y-4' : 'space-y-5'}
      noValidate
    >
      {askName && (
        <Field label="Name" htmlFor={`${uid}-name`} hint="Optional">
          <input
            id={`${uid}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Whose chart is this?"
            className={inputClass}
            autoComplete="off"
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" htmlFor={`${uid}-date`}>
          <input
            id={`${uid}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min="1800-01-01"
            max="2400-12-31"
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Time of birth"
          htmlFor={`${uid}-time`}
          hint={timeUnknown ? 'Cast for noon' : '24-hour clock'}
        >
          <input
            id={`${uid}-time`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
            disabled={timeUnknown}
            required={!timeUnknown}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={timeUnknown}
          onChange={(e) => setTimeUnknown(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-gold-500)]"
        />
        <span style={{ color: 'var(--text-secondary)' }}>
          I don’t know the time of birth
          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
            The chart is still cast, but the ascendant, houses and dasha dates
            cannot be relied on — everything affected is marked.
          </span>
        </span>
      </label>

      <PlaceField
        id={`${uid}-place`}
        value={place}
        onChange={setPlace}
        initialQuery={initial?.place?.label}
      />

      {error && (
        <p
          role="alert"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'color-mix(in oklab, var(--color-malefic) 40%, transparent)',
            color: 'var(--color-malefic)',
            background: 'color-mix(in oklab, var(--color-malefic) 8%, transparent)',
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group relative w-full overflow-hidden rounded-lg px-6 py-3.5 text-sm
                   font-medium tracking-wide transition-all duration-300
                   disabled:cursor-wait disabled:opacity-70"
        style={{
          background:
            'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
          color: '#160f00',
          transitionTimingFunction: 'var(--ease-out-soft)',
        }}
      >
        <span className="relative z-10">
          {submitting ? 'Calculating…' : submitLabel}
        </span>
        {/* Light sweep on hover. */}
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full transition-transform duration-700
                     group-hover:translate-x-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          }}
        />
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Place autocomplete
// ---------------------------------------------------------------------------

function PlaceField({
  id,
  value,
  onChange,
  initialQuery,
}: {
  id: string;
  value: PlaceResult | null;
  onChange: (p: PlaceResult | null) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced lookup. The request is aborted when the query changes so a slow
  // earlier response can never overwrite a newer one.
  useEffect(() => {
    if (value && query === value.label) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const body = (await res.json()) as { results: PlaceResult[] };
        setResults(body.results);
        setOpen(true);
        setHighlighted(0);
      } catch {
        // Aborted or offline — leave the previous suggestions in place.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value]);

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function select(place: PlaceResult) {
    onChange(place);
    setQuery(place.label);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Field
        label="Place of birth"
        htmlFor={id}
        hint={value ? `${value.timezone}` : 'Start typing a city'}
      >
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlighted((h) => (h + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlighted((h) => (h - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              select(results[highlighted]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="City of birth"
          className={inputClass}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          required
        />
      </Field>

      {loading && (
        <span
          className="absolute right-3 top-[2.35rem] text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          searching…
        </span>
      )}

      {open && results.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border shadow-2xl"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border-strong)',
          }}
        >
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onClick={() => select(p)}
                onMouseEnter={() => setHighlighted(i)}
                className="block w-full px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background:
                    i === highlighted
                      ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                      : 'transparent',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {[p.admin1, p.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] transition-colors duration-200 ' +
  'placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)] disabled:opacity-40 ' +
  '[color-scheme:dark]';

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
