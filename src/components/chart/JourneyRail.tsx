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
      className="no-print relative mb-10"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {translate('rail.path')}
      </p>

      {/*
        Seven numbers on one line, at every width.

        This was seven chips each carrying a number and a two-line label, in a
        horizontally scrolling list. At 375px that measured 825px inside a 335px
        box: five of the seven steps were off screen behind a scrollbar, the
        labels wrapped to three lines, and the whole thing changed shape from tool
        to tool because each page had picked its own content width.

        Fitting seven labels on one line is not possible at a phone width and only
        just possible at 1024px, so the labels are not the thing to preserve — the
        *path* is. Numbers always, one line, 44px targets, and the step you are on
        named underneath where there is room to say it properly. Each number
        carries its full name for a screen reader and as a tooltip.
      */}
      {/*
        Seven 44px targets need 308px before any gap, and a 375px phone leaves
        about 320px inside the page padding. Fixed gaps overflowed it by 24px, so
        below `sm` the row fills the width and distributes whatever is left over
        as the gaps: `justify-between` cannot exceed its container, so the row can
        never scroll however narrow the screen gets, and the targets stay 44px.

        At 320px even that is not enough — seven 44px targets are 308px and the
        content box is 265px — so below `sm` the row is allowed to wrap onto a
        second line. Wrapping keeps the targets touchable and keeps the scrollbar
        away, which is the right trade: shrinking the circles to fit would put
        them under the 44px minimum on exactly the devices where that matters
        most.
      */}
      <ol className="mt-3 flex w-full flex-wrap items-center justify-between gap-y-1.5 sm:w-auto sm:flex-nowrap sm:justify-start sm:gap-1.5 lg:gap-0.5">
        {JOURNEY.map((feature, i) => {
          const tool = byFeature.get(feature);
          if (!tool) return null;

          const isCurrent = feature === current;
          const refused = !isCurrent && access[feature] && !access[feature].allowed;
          const done = currentIndex >= 0 && i < currentIndex;
          const name = `${translate(`step.${feature}`, STEP_VERB[feature])} — ${tool.label}${refused ? ' (members)' : ''}`;

          /*
            Two shapes, one component.

            From `lg` up there is room for the labelled version — the one that was
            asked for back — so the chip carries a small numbered disc and the
            step's name on two lines. Below `lg` seven labels cannot fit (they need
            about 994px and a phone has 335px), so the chip collapses to the disc
            alone at a full 44px, and the step is named once underneath instead.
            Same markup, same order, same targets; only the amount said out loud
            changes.
          */
          const dot = (
            <span
              className="flex min-h-11 items-center gap-2 rounded-full px-1 lg:px-2.5"
              style={{
                background: isCurrent
                  ? 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)'
                  : undefined,
              }}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm
                           transition-colors duration-300 lg:h-6 lg:w-6 lg:text-[0.7rem]"
                style={{
                  background: isCurrent
                    ? 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))'
                    : done
                      ? 'color-mix(in oklab, var(--color-gold-500) 18%, transparent)'
                      : 'transparent',
                  border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                  color: isCurrent ? '#150e00' : 'var(--color-gold-300)',
                }}
              >
                <span className="numeric">{i + 1}</span>
              </span>

              <span className="hidden flex-col leading-tight lg:flex">
                <span
                  className="whitespace-nowrap text-xs font-medium"
                  style={{ color: isCurrent ? 'var(--color-gold-200)' : 'var(--text-secondary)' }}
                >
                  {translate(`step.${feature}`, STEP_VERB[feature])}
                </span>
                <span
                  className="whitespace-nowrap text-[0.65rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {tool.label}
                  {refused ? ' · members' : ''}
                </span>
              </span>
            </span>
          );

          return (
            <li key={feature}>
              {isCurrent || !suffix ? (
                <div aria-current={isCurrent ? 'step' : undefined} title={name}>
                  <span className="sr-only">{name}</span>
                  {dot}
                </div>
              ) : (
                <Link href={`${tool.href}?${suffix}`} title={name} aria-label={name}>
                  {dot}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* The step you are on, named where there is room for its full name. */}
      {currentIndex >= 0 && (
        <p className="mt-2.5 text-sm lg:hidden" style={{ color: 'var(--text-secondary)' }}>
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
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
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
              className="rounded-full px-2.5 py-1 text-[0.7rem]"
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
              className="rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors duration-300"
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
            <span
              aria-hidden
              className="mx-1 h-3 w-px shrink-0"
              style={{ background: 'var(--border-subtle)' }}
            />
            <Link
              href={`/report?${suffix}`}
              className="inline-flex items-center gap-1 px-1 py-1 text-[0.7rem] transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
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
