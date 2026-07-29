'use client';

import { useEffect, useRef, useState } from 'react';

import type { PlaceResult } from '@/lib/geo/geocode';

/**
 * Shared place lookup field.
 *
 * The birth form, the place picker and the matching form all need the same
 * behaviour, so it lives here once rather than three times.
 *
 * Requests are debounced and aborted when the query changes, which matters
 * more than it sounds: without the abort, a slow earlier response can land
 * after a newer one and silently replace the right suggestions with stale
 * ones.
 */
export interface PlaceAutocompleteProps {
  id: string;
  label: string;
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  required?: boolean;
  initialQuery?: string;
}

export function PlaceAutocomplete({
  id,
  label,
  value,
  onChange,
  required,
  initialQuery,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery ?? value?.label ?? '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
        // Aborted or offline. Leave the previous suggestions in place.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value]);

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
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
          {loading ? 'searching…' : value ? value.timezone : 'Start typing a city'}
        </span>
      </div>

      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
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
        className="w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm
                   text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                   focus:border-[var(--color-gold-500)]"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        required={required}
      />

      {open && results.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-2xl"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-strong)' }}
        >
          {results.map((place, i) => (
            <li key={place.id} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onClick={() => select(place)}
                onMouseEnter={() => setHighlighted(i)}
                className="block w-full px-3 py-2 text-left text-sm"
                style={{
                  background:
                    i === highlighted
                      ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                      : 'transparent',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{place.name}</span>
                <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {[place.admin1, place.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
