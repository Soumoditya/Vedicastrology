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
 * Whose chart you are reading, and how to change it.
 *
 * The site could show you a chart for twenty minutes without ever naming who it
 * belonged to. On a site where a person may hold their own chart, a partner's
 * and a child's, that is a real hazard: the pages look identical and the only
 * difference is a query string nobody reads.
 *
 * So the current chart is named in the header, and switching keeps you on the
 * page you are on rather than throwing you back to a form. Reading Sade Sati for
 * one person and wanting it for another is a change of subject, not a change of
 * task.
 *
 * Renders nothing when there is nothing to switch between, which is the common
 * case for a signed-out visitor and costs them no space.
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
        className="flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
        style={{
          borderColor: open ? 'var(--color-gold-500)' : 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--color-gold-500)' }}
        />
        <span className="max-w-[8rem] truncate">{shown}</span>
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
