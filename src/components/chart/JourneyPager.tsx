import Link from 'next/link';

import { JOURNEY, STEP_VERB, TOOL_LINKS } from '@/lib/site';
import { getT } from '@/lib/i18n/server';

/**
 * The pager at the foot of a result.
 *
 * Asked for in the shape of a browser's page numbers, and it earns its place
 * there rather than at the top: by the time you reach the bottom you have read
 * the thing, so "where next" is a real question. The rail at the top says where
 * you are; this says where to go.
 *
 * Previous and next are spelled out because a bare row of numbers makes you count
 * to work out which one is adjacent, and the whole point of a pager is that the
 * next step should take no thought.
 */
export async function JourneyPager({
  current,
  query,
}: {
  current: string;
  /** The chart, carried to every step so the pager never drops it. */
  query: string;
}) {
  const { t } = await getT();
  const verb = (f: string) => t(`step.${f}`, STEP_VERB[f]);
  const byFeature = new Map(TOOL_LINKS.map((tool) => [tool.feature as string, tool]));
  const index = JOURNEY.indexOf(current as (typeof JOURNEY)[number]);
  if (index === -1 || !query) return null;

  const href = (feature: (typeof JOURNEY)[number]) =>
    `${byFeature.get(feature)?.href}?${query}`;
  const previous = index > 0 ? JOURNEY[index - 1] : null;
  const next = index < JOURNEY.length - 1 ? JOURNEY[index + 1] : null;

  return (
    <nav
      aria-label={t('pager.aria')}
      className="no-print mt-14 border-t pt-8"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <ol className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {previous ? (
            <Link
              href={href(previous)}
              rel="prev"
              className="flex min-h-11 items-center rounded-full px-3 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span aria-hidden className="mr-1.5">
                ‹
              </span>
              <span className="hidden sm:inline">{verb(previous)}</span>
              <span className="sm:hidden">{t('pager.back')}</span>
            </Link>
          ) : (
            <span
              className="flex min-h-11 items-center px-3 text-sm opacity-40"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden
            >
              ‹
            </span>
          )}
        </li>

        {JOURNEY.map((feature, i) => {
          const isCurrent = feature === current;
          const tool = byFeature.get(feature);
          if (!tool) return null;
          const name = `${verb(feature)} — ${tool.label}`;

          return (
            <li key={feature}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  title={name}
                  className="numeric grid min-h-11 min-w-11 place-items-center rounded-full text-sm"
                  style={{
                    background:
                      'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
                    color: '#150e00',
                  }}
                >
                  {i + 1}
                </span>
              ) : (
                <Link
                  href={href(feature)}
                  title={name}
                  aria-label={name}
                  className="numeric grid min-h-11 min-w-11 place-items-center rounded-full border
                             text-sm transition-colors duration-300"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {i + 1}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {next ? (
            <Link
              href={href(next)}
              rel="next"
              className="flex min-h-11 items-center rounded-full px-3 text-sm"
              style={{ color: 'var(--color-gold-300)' }}
            >
              <span className="hidden sm:inline">{verb(next)}</span>
              <span className="sm:hidden">{t('pager.next')}</span>
              <span aria-hidden className="ml-1.5">
                ›
              </span>
            </Link>
          ) : (
            <span
              className="flex min-h-11 items-center px-3 text-sm opacity-40"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden
            >
              ›
            </span>
          )}
        </li>
      </ol>
    </nav>
  );
}
