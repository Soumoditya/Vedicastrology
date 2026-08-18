import { BirthForm } from '@/components/forms/BirthForm';
import { JourneyRail } from '@/components/chart/JourneyRail';
import { ReportCover, ReportFooter } from '@/components/chart/ReportChrome';
import { ChartSwitcher } from '@/components/chart/ChartSwitcher';
import { Reveal } from '@/components/motion/Reveal';
import { chartQueryString, getSavedCharts } from '@/lib/astro/current-chart';

/**
 * The frame every tool result sits in.
 *
 * The complaint was that the tool pages look uneven and inconsistent, and the
 * cause was not the journey rail that kept getting blamed for it. Eleven result
 * pages had each chosen their own content width — kundli at `max-w-6xl` (1152px),
 * transits and panchang at 5xl, dasha, yogas and matching at 4xl, and nakshatra,
 * remedies, manglik, kalsarpa and sade-sati at 3xl (768px) — with vertical
 * padding ranging from `py-12` to `py-28`. The rail is identical markup on all of
 * them, so at 1152px it sat in one tidy row and at 768px it wrapped to three
 * lines and grew a scrollbar. Every other misalignment between tools came from
 * the same place.
 *
 * So the frame is owned here, once: one width, one rhythm, the rail, the result
 * header, and the form for casting somebody else's chart. A tool page is now only
 * the part that is genuinely its own.
 *
 * This is also where the chart switcher lives, rather than in the site header
 * where it was competing with the account menu and showing the same name. Whose
 * chart is on screen belongs to the page you are reading.
 */
export async function ToolResult({
  feature,
  params,
  eyebrow,
  title,
  meta,
  action,
  submitLabel,
  cover,
  footer = false,
  anotherLabel = 'Another chart',
  children,
}: {
  /** Feature key, for the rail's current step. */
  feature: string;
  /** The page's search params, carried to every step of the rail. */
  params: Record<string, string | string[] | undefined>;
  eyebrow: string;
  /** Node rather than string: some titles set part of themselves in gold. */
  title: React.ReactNode;
  /** The line under the title: date, time and place. */
  meta?: React.ReactNode;
  /** Where the "another chart" form submits. */
  action: string;
  submitLabel: string;
  /** Printed cover, on the tools that produce a document. */
  cover?: { title: string; subtitle?: string };
  /** Some tools print, most do not; the footer only belongs on the ones that do. */
  footer?: boolean;
  anotherLabel?: string;
  children: React.ReactNode;
}) {
  const charts = await getSavedCharts();

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="report-body relative mx-auto max-w-5xl px-5 py-12 sm:py-16">
        {cover && <ReportCover title={cover.title} subtitle={cover.subtitle} />}

        <JourneyRail current={feature} params={params} />

        <header className="mb-10">
          <p className="eyebrow" data-reveal>
            {eyebrow}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1
              className="font-display text-3xl sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
              data-reveal
            >
              {title}
            </h1>

            {/* Switching subject keeps you on the tool you are reading. */}
            <ChartSwitcher
              charts={charts.map((c) => ({
                id: c.id,
                label: c.label,
                query: chartQueryString(c),
                isDefault: c.is_default,
              }))}
            />
          </div>

          {meta && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }} data-reveal>
              {meta}
            </p>
          )}
        </header>

        {children}

        {/* Somebody else's chart. */}
        <section className="no-print mt-16 border-t pt-10" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="eyebrow">{anotherLabel}</h2>
          <div className="surface-card mt-5 p-6 sm:p-8">
            <BirthForm action={action} submitLabel={submitLabel} />
          </div>
        </section>

        {footer && <ReportFooter />}
      </div>
    </div>
  );
}
