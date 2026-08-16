import type { Metadata } from 'next';
import Link from 'next/link';

import { TOOL_LINKS } from '@/lib/site';
import { canUseAll } from '@/lib/features/flags';
import { getT } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Free Vedic Astrology Tools',
  description:
    'Birth chart, panchang, dasha periods, transits, compatibility and ' +
    'nakshatra finder, calculated with the Swiss Ephemeris. Free, no account.',
};

export const dynamic = 'force-dynamic';

export default async function ToolsPage() {
  /*
    One query for the lot. A tool switched off disappears entirely, since
    listing something that refuses to open is worse than not listing it. A tool
    that merely needs an account is still listed, with a mark, because that is
    an invitation rather than a dead end.
  */
  const [access, { t }] = await Promise.all([
    canUseAll(TOOL_LINKS.map((tool) => tool.feature)),
    getT(),
  ]);
  const tools = TOOL_LINKS.filter(
    (tool) => access[tool.feature].reason !== 'disabled',
  );

  return (
    <div className="relative">
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <header className="mb-12 max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            {t('tools.eyebrow')}
          </p>
          <h1
            className="font-display mt-3 text-4xl sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('tools.heading')}
          </h1>
          <p
            className="mt-5 text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('tools.intro')}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
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
              <div className="flex items-start justify-between gap-3">
                <p
                  className="font-quote text-sm italic"
                  style={{ color: 'var(--color-gold-600)' }}
                >
                  {tool.sanskrit}
                </p>
                {!access[tool.feature].allowed && (
                  <span
                    className="rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--color-gold-500)',
                    }}
                  >
                    {access[tool.feature].reason === 'needs_premium'
                      ? t('tools.membersBadge')
                      : t('tools.accountBadge')}
                  </span>
                )}
              </div>
              <h2
                className="font-display mt-1 text-xl"
                style={{ color: 'var(--text-primary)' }}
              >
                {t(`tool.${tool.feature}.label`, tool.label)}
              </h2>
              <p
                className="mt-2.5 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t(`tool.${tool.feature}.description`, tool.description)}
              </p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 text-xs transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ color: 'var(--color-gold-400)' }}
              >
                {t('tools.open')}
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
