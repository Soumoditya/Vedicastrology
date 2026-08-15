import Link from 'next/link';

import { TOOL_LINKS } from '@/lib/site';
import { canUseAll } from '@/lib/features/flags';

/**
 * The journey rail.
 *
 * The site had no spine. Each tool showed its result and offered a blank form,
 * so nothing told you where you were or what to look at next, and reaching
 * Compatibility from a chart dead-ended on a two-person form with no way back.
 * The complaint, in the user's words, was that there is no "what to do after
 * what".
 *
 * This is that. A single ordered path through the chart, understand what it is,
 * what is running, what it forms, what is coming, what helps, and how it meets
 * another chart, ending at a real reading. It carries the same chart from step
 * to step, marks where you are, and is present on every tool page and on the
 * compatibility form, so there is always a way onward and a way out.
 *
 * Panchang is not on the path: it is about a day and a place, not a person.
 */

/** The order of understanding a chart, by feature key. */
const JOURNEY = ['kundli', 'nakshatra', 'dasha', 'yogas', 'transits', 'remedies', 'matching'] as const;

const STEP_VERB: Record<string, string> = {
  kundli: 'Your chart',
  nakshatra: 'Your star',
  dasha: 'What is running',
  yogas: 'What it forms',
  transits: 'What is coming',
  remedies: 'What helps',
  matching: 'With another',
};

export async function JourneyRail({
  current,
  params,
  query: explicitQuery,
}: {
  /** Feature key of the page this renders on. */
  current: string;
  /** The page's search params, carried to every step. */
  params?: Record<string, string | string[] | undefined>;
  /** An explicit query string instead, for compatibility's dual charts. */
  query?: string;
}) {
  let suffix = explicitQuery ?? '';
  if (!explicitQuery && params) {
    const built = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      built.set(key, Array.isArray(value) ? value[0] : value);
    }
    suffix = built.toString();
  }

  const byFeature = new Map(TOOL_LINKS.map((t) => [t.feature, t]));
  const access = await canUseAll(JOURNEY.filter((f) => f !== current));

  const currentIndex = JOURNEY.indexOf(current as (typeof JOURNEY)[number]);

  return (
    <nav
      aria-label="Where to go with this chart"
      className="no-print relative mb-10"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        The path through a chart
      </p>

      {/* Horizontal scroll on a phone, where seven steps will not fit. */}
      <ol className="mt-3 flex gap-1.5 overflow-x-auto pb-2">
        {JOURNEY.map((feature, i) => {
          const tool = byFeature.get(feature);
          if (!tool) return null;

          const isCurrent = feature === current;
          const refused = !isCurrent && access[feature] && !access[feature].allowed;
          const done = currentIndex >= 0 && i < currentIndex;

          const inner = (
            <>
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] tabular-nums"
                style={{
                  background: isCurrent
                    ? 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))'
                    : done
                      ? 'color-mix(in oklab, var(--color-gold-500) 22%, transparent)'
                      : 'transparent',
                  border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                  color: isCurrent ? '#150e00' : 'var(--color-gold-300)',
                }}
              >
                {i + 1}
              </span>
              <span className="flex flex-col leading-tight">
                <span
                  className="text-xs font-medium"
                  style={{ color: isCurrent ? 'var(--color-gold-200)' : 'var(--text-secondary)' }}
                >
                  {STEP_VERB[feature]}
                </span>
                <span className="text-[0.65rem]" style={{ color: 'var(--text-muted)' }}>
                  {tool.label}
                  {refused ? ' · members' : ''}
                </span>
              </span>
            </>
          );

          const cls = 'flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors duration-300';

          return (
            <li key={feature}>
              {isCurrent || !suffix ? (
                <div
                  className={cls}
                  aria-current={isCurrent ? 'step' : undefined}
                  style={{
                    background: isCurrent ? 'color-mix(in oklab, var(--color-gold-500) 10%, transparent)' : undefined,
                  }}
                >
                  {inner}
                </div>
              ) : (
                <Link href={`${tool.href}?${suffix}`} className={`${cls} lift`}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}

        {/* The path ends at a real reading, which is the point of all of it. */}
        <li>
          <Link
            href="/services"
            className="lift flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
          >
            <span className="text-xs font-medium">Read it properly</span>
            <span aria-hidden style={{ color: 'var(--color-gold-400)' }}>→</span>
          </Link>
        </li>
      </ol>
    </nav>
  );
}
