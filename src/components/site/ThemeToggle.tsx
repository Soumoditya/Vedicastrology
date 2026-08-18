'use client';

import { useEffect, useState } from 'react';
import { svgCoord } from '@/lib/svg-coord';

type Theme = 'dark' | 'light';

/**
 * Theme switch.
 *
 * The stored preference is applied by an inline script in the site layout
 * before first paint, so there is no flash of the wrong theme. This component
 * only has to keep its own icon in sync after hydration.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme | undefined) ?? 'dark';
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private browsing can block storage; the toggle still works for the session.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="grid h-9 w-9 place-items-center rounded-full border transition-colors duration-300"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Rendered only after mount so server and client markup agree. */}
      {mounted && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          {theme === 'dark' ? (
            // Crescent moon
            <path
              d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          ) : (
            // Sun
            <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * 45 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={svgCoord(12 + Math.cos(a) * 6.8)}
                    y1={svgCoord(12 + Math.sin(a) * 6.8)}
                    x2={svgCoord(12 + Math.cos(a) * 9)}
                    y2={svgCoord(12 + Math.sin(a) * 9)}
                  />
                );
              })}
            </g>
          )}
        </svg>
      )}
    </button>
  );
}
