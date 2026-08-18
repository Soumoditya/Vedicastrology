'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface ChartOption {
  id: string;
  label: string;
  query: string;
  isDefault: boolean;
}

/**
 * Change whose chart you are reading, without leaving the page.
 *
 * This began life in the site header and was wrong there. The chart is usually
 * named after its owner, so it sat beside the account avatar showing the same
 * name, and the header carried two dropdowns both reading "Soumoditya" — one
 * offering "Another chart…", the other "Your charts". Whose chart is on screen is
 * a property of the page, not of the site.
 *
 * So it sits next to the chart's own title now, where the page already says whose
 * chart it is, and reads as a modifier of that title rather than as a second
 * account menu. Switching keeps you on the tool you are reading: wanting Sade
 * Sati for somebody else is a change of subject, not a change of task.
 *
 * Renders nothing when there is nothing to switch between, so a signed-out
 * visitor pays no space for it.
 */
export function ChartSwitcher({
  charts,
  currentName,
}: {
  charts: ChartOption[];
  /** The name in the current URL, which may be a chart nobody has saved. */
  currentName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (charts.length === 0) return null;

  const shown = currentName ?? charts.find((c) => c.isDefault)?.label ?? charts[0].label;

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Reading ${shown}. Change chart`}
        className="no-print flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs
                   transition-colors duration-300"
        style={{
          borderColor: open ? 'var(--color-gold-500)' : 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        change chart
        <span aria-hidden className="text-[0.6rem]">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border py-1"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 18px 40px -18px rgba(0, 0, 0, 0.7)',
          }}
        >
          {charts.map((chart) => (
            <Link
              key={chart.id}
              role="menuitem"
              // Stay on the page, change the subject.
              href={`${pathname}?${chart.query}`}
              className="block px-3.5 py-2.5 text-sm"
              style={{
                color:
                  chart.label === shown
                    ? 'var(--color-gold-300)'
                    : 'var(--text-secondary)',
              }}
            >
              {chart.label}
              {chart.isDefault && (
                <span
                  className="ml-1.5 text-[0.65rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  default
                </span>
              )}
            </Link>
          ))}

          <Link
            role="menuitem"
            href={`${pathname}?new=1`}
            className="mt-1 block border-t px-3.5 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            Another chart…
          </Link>
        </div>
      )}
    </div>
  );
}
