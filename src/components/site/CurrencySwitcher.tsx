'use client';

import { useState, useRef, useEffect } from 'react';

import { setRegion } from '@/lib/enquiries/actions';
import type { Region } from '@/lib/supabase/types';

/**
 * Currency switcher.
 *
 * Country detection is a guess: a VPN, a traveller or a diaspora customer will
 * all be shown the wrong currency at some point. Rather than pretend detection
 * is right, the current choice is always visible and always changeable, and an
 * explicit choice beats detection permanently.
 */
export function CurrencySwitcher({
  regions,
  current,
}: {
  regions: Region[];
  current: Region | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // With a single region there is nothing to choose between.
  if (regions.length < 2 || !current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors duration-300"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
      >
        <span style={{ color: 'var(--color-gold-300)' }}>{current.symbol}</span>
        {current.currency}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-lg border shadow-2xl"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-strong)' }}
        >
          {regions.map((region) => (
            <li key={region.id} role="option" aria-selected={region.id === current.id}>
              <form action={setRegion}>
                <input type="hidden" name="region" value={region.code} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                  style={{
                    background:
                      region.id === current.id
                        ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                        : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{region.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {region.symbol} {region.currency}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
