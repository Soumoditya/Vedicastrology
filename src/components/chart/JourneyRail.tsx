import Link from 'next/link';

import { CHECK_FEATURES, JOURNEY, STEP_VERB, TOOL_LINKS } from '@/lib/site';
import { canUseAll } from '@/lib/features/flags';
import { getT } from '@/lib/i18n/server';
import { chartQueryString, getDefaultChart } from '@/lib/astro/current-chart';

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

  /*
    With no chart in the page's own params every step would link to a bare path
    and the rail would walk somebody from one empty form to the next. Falling
    back to the saved default keeps the same chart along the whole path, which
    is the entire point of the rail.
  */
  if (!suffix) {
    const fallback = await getDefaultChart();
    if (fallback) suffix = chartQueryString(fallback);
  }

  const { t: translate } = await getT();
  const byFeature = new Map(TOOL_LINKS.map((tool) => [tool.feature, tool]));
  const access = await canUseAll([
    ...JOURNEY.filter((f) => f !== current),
    ...CHECK_FEATURES.filter((f) => f !== current),
  ]);

  const currentIndex = JOURNEY.indexOf(current as (typeof JOURNEY)[number]);

  return (
    <nav
      aria-label={translate('rail.aria')}
      className="no-print relative mb-10 rounded-2xl border p-5 sm:p-6"
      style={{
        /* Its own panel. Loose on the page the rail read as stray links above the
           content; inside a surface it reads as the navigation for what follows,
           and the steps stop crowding the heading beneath them. */
        borderColor: 'var(--border-subtle)',
        background: 'color-mix(in oklab, var(--surface-raised) 60%, transparent)',
      }}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {translate('rail.path')}
      </p>

      {/*
        A path that looks like a path.

        The steps are joined by a line, because that is what tells you at a glance
        that these are stages of one reading rather than seven unrelated links, and
        it was the thing the numbers-only version lost. Each step is an equal
        column with its disc centred and its name underneath, so the labels no
        longer have to fit *between* the discs — which is what made seven labels
        impossible on anything narrower than 1024px. Now they sit below, where
        there is room for two lines.

        The connector is drawn per step rather than as one line behind everything:
        a full-width hairline on each column except the first, shifted half a
        column left, so it runs from the previous disc's centre to this one's and
        cannot overshoot either end. Completed stretches are gold, the rest are the
        subtle border, so the line carries progress as well as structure.

        Discs stay 44px at every size. Labels are hidden below `lg` and the step is
        named once underneath instead, because seven two-line labels genuinely do
        not fit a phone and shrinking them to make them fit is how you get
        something nobody can read.
      */}
      <ol className="mt-4 flex items-start">
        {JOURNEY.map((feature, i) => {
          const tool = byFeature.get(feature);
          if (!tool) return null;

          const isCurrent = feature === current;
          const refused = !isCurrent && access[feature] && !access[feature].allowed;
          const done = currentIndex >= 0 && i < currentIndex;
          const verb = translate(`step.${feature}`, STEP_VERB[feature]);
          const name = `${verb} — ${tool.label}${refused ? ' (members)' : ''}`;

          const disc = (
            <span
              className="relative z-10 grid h-11 w-11 place-items-center rounded-full text-sm
                         transition-colors duration-300"
              style={{
                background: isCurrent
                  ? 'linear-gradient(135deg, var(--color-gold-300), var(--color-gold-500))'
                  : done
                    ? 'color-mix(in oklab, var(--color-gold-500) 20%, var(--surface))'
                    : 'var(--surface)',
                border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                color: isCurrent ? '#150e00' : 'var(--color-gold-300)',
                boxShadow: isCurrent
                  ? '0 0 0 4px color-mix(in oklab, var(--color-gold-500) 18%, transparent)'
                  : undefined,
              }}
            >
              <span className="numeric">{i + 1}</span>
            </span>
          );

          const label = (
            <span className="mt-2.5 hidden flex-col text-center lg:flex">
              <span
                className="text-xs font-medium leading-tight"
                style={{ color: isCurrent ? 'var(--color-gold-200)' : 'var(--text-secondary)' }}
              >
                {verb}
              </span>
              <span
                className="mt-0.5 text-[0.65rem] leading-tight"
                style={{ color: 'var(--text-muted)' }}
              >
                {tool.label}
                {refused ? ' · members' : ''}
              </span>
            </span>
          );

          return (
            <li key={feature} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-[22px] h-px w-full -translate-x-1/2"
                  style={{
                    background: done || isCurrent
                      ? 'color-mix(in oklab, var(--color-gold-500) 45%, transparent)'
                      : 'var(--border-subtle)',
                  }}
                />
              )}

              {isCurrent || !suffix ? (
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  title={name}
                  className="flex flex-col items-center"
                >
                  <span className="sr-only">{name}</span>
                  {disc}
                  {label}
                </div>
              ) : (
                <Link
                  href={`${tool.href}?${suffix}`}
                  title={name}
                  aria-label={name}
                  className="flex flex-col items-center"
                >
                  {disc}
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* The step you are on, named where the labels are hidden. */}
      {currentIndex >= 0 && (
        <p className="mt-3 text-sm lg:hidden" style={{ color: 'var(--text-secondary)' }}>
          <span className="numeric" style={{ color: 'var(--color-gold-300)' }}>
            {currentIndex + 1}
          </span>
          <span style={{ color: 'var(--text-muted)' }}> {translate('rail.of')} </span>
          <span className="numeric" style={{ color: 'var(--text-muted)' }}>
            {JOURNEY.length}
          </span>
          {' · '}
          {translate(`step.${current}`, STEP_VERB[current])}
          <span style={{ color: 'var(--text-muted)' }}>
            {' — '}
            {byFeature.get(JOURNEY[currentIndex])?.label}
          </span>
        </p>
      )}

      {/*
        The named afflictions, on a second row. They are lookups rather than
        steps on the path, so numbering them alongside the journey would imply
        an order that does not exist. Kept visible because these three are what
        people arrive already worried about.
      */}
      <div
        className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
          {translate('rail.checks')}
        </span>
        {CHECK_FEATURES.map((feature) => {
          const tool = byFeature.get(feature);
          if (!tool) return null;

          const isCurrent = feature === current;
          const refused = !isCurrent && access[feature] && !access[feature].allowed;

          const label = (
            <>
              {tool.label}
              {refused ? ' · members' : ''}
            </>
          );

          return isCurrent || !suffix ? (
            <span
              key={feature}
              aria-current={isCurrent ? 'page' : undefined}
              className="flex min-h-11 items-center rounded-full px-3.5 text-xs"
              style={{
                background: isCurrent
                  ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                  : undefined,
                color: isCurrent ? 'var(--color-gold-200)' : 'var(--text-muted)',
              }}
            >
              {label}
            </span>
          ) : (
            <Link
              key={feature}
              href={`${tool.href}?${suffix}`}
              className="flex min-h-11 items-center rounded-full border px-3.5 text-xs transition-colors duration-300"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              {label}
            </Link>
          );
        })}

        {/*
          The whole chart in one document, which is not a "specific check" and
          was reading as one: it sat fourth in this row wearing a gold border
          while Manglik, Kalsarpa and Sade Sati wore grey, so it looked like the
          most important of four things of the same kind. It is a different kind
          of thing. Separated by a rule and set as a plain link with an arrow, so
          the row reads "these three checks — and separately, all of it".
        */}
        {suffix && (
          <>
            {/* Pushed to its own end of the row, so the three checks read as a
                group and this reads as the destination it is. */}
            <span className="ml-auto" />
            <Link
              href={`/report?${suffix}`}
              className="flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs
                         font-medium transition-colors duration-300"
              style={{
                borderColor: 'var(--color-gold-600)',
                background: 'color-mix(in oklab, var(--color-gold-500) 10%, transparent)',
                color: 'var(--color-gold-200)',
              }}
            >
              {translate('rail.fullReport')}
              <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
