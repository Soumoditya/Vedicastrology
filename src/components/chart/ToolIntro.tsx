import { BirthForm } from '@/components/forms/BirthForm';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';
import { getFormLabels } from '@/lib/i18n/server';

/**
 * The opening state of a tool, before any birth details have been given.
 *
 * Every tool page had its own copy of this, which meant a change to the
 * entry experience had to be made seven times and was made inconsistently.
 * One component, so a tool page is only the part that is actually its own.
 */
export async function ToolIntro({
  eyebrow,
  headline,
  highlight,
  children,
  action,
  submitLabel,
}: {
  eyebrow: string;
  headline: string;
  /** The second line, set in gold. */
  highlight: string;
  /** The explanation. Prose, not a list. */
  children: React.ReactNode;
  action: string;
  submitLabel: string;
}) {
  const formLabels = await getFormLabels();

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
        <h1
          className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          {headline}
          <span className="text-gold-leaf block">{highlight}</span>
        </h1>
        <div
          className="mt-7 space-y-4 text-[1.0625rem] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          data-reveal
        >
          {children}
        </div>
        <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
          <SavedChartPicker action={action} />
          <BirthForm action={action} submitLabel={submitLabel} labels={formLabels} />
        </div>
      </div>
    </div>
  );
}
