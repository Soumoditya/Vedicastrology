import type { Metadata } from 'next';
import Link from 'next/link';

import { TOOL_LINKS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free Vedic Astrology Tools',
  description:
    'Birth chart, panchang, dasha periods, transits, compatibility and ' +
    'nakshatra finder, calculated with the Swiss Ephemeris. Free, no account.',
};

export default function ToolsPage() {
  return (
    <div className="relative">
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <header className="mb-12 max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Free tools
          </p>
          <h1
            className="font-display mt-3 text-4xl sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Study your own chart
          </h1>
          <p
            className="mt-5 text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            These run the same calculations I use in a paid reading. They are
            free because a chart you can check for yourself is worth more than
            one you are asked to take on trust. Nothing here needs an account.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {TOOL_LINKS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="surface-card group relative overflow-hidden p-6 transition-all duration-500"
              style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--color-gold-400), transparent)',
                }}
              />
              <p
                className="font-quote text-sm italic"
                style={{ color: 'var(--color-gold-600)' }}
              >
                {tool.sanskrit}
              </p>
              <h2
                className="font-display mt-1 text-xl"
                style={{ color: 'var(--text-primary)' }}
              >
                {tool.label}
              </h2>
              <p
                className="mt-2.5 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tool.description}
              </p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 text-xs transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ color: 'var(--color-gold-400)' }}
              >
                Open
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
