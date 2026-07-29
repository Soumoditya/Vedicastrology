'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PlaceResult } from '@/lib/geo/geocode';

export interface PlacePickerProps {
  /** Route to navigate to once a place is chosen. */
  action: string;
  /** Query parameters to carry across, such as the currently viewed date. */
  extraParams?: Record<string, string>;
  currentLabel?: string;
  label?: string;
}

/**
 * A standalone place chooser, for tools that need a location but no birth
 * details — the panchang, the transit calendar, muhurta.
 *
 * Shares the same lookup endpoint as the birth form, so the built-in Indian
 * city list answers instantly here too.
 */
export function PlacePicker({
  action,
  extraParams = {},
  currentLabel = '',
  label = 'Place',
}: PlacePickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState(currentLabel);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query === currentLabel || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const body = (await res.json()) as { results: PlaceResult[] };
        setResults(body.results);
        setOpen(true);
        setHighlighted(0);
      } catch {
        // Aborted or offline — keep whatever is on screen.
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, currentLabel]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function choose(place: PlaceResult) {
    const params = new URLSearchParams(extraParams);
    params.set('lat', place.latitude.toFixed(4));
    params.set('lon', place.longitude.toFixed(4));
    params.set('tz', place.timezone);
    params.set('place', place.label);
    setOpen(false);
    setQuery(place.label);
    router.push(`${action}?${params.toString()}`);
  }

  return (
    <div ref={ref} className="relative">
      <label
        htmlFor="place-picker"
        className="mb-1.5 block text-xs uppercase tracking-[0.12em]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      <input
        id="place-picker"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
            choose(results[highlighted]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder="Change place"
        className="w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2 text-sm
                   placeholder:text-[var(--text-muted)] focus:border-[var(--color-gold-500)]"
        style={{ color: 'var(--text-primary)' }}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border shadow-2xl"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border-strong)',
          }}
        >
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onClick={() => choose(p)}
                onMouseEnter={() => setHighlighted(i)}
                className="block w-full px-3 py-2 text-left text-sm"
                style={{
                  background:
                    i === highlighted
                      ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                      : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                {p.name}
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
