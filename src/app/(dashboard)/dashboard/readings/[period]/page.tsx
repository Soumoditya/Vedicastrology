import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';

import { createClient, getUser } from '@/lib/supabase/server';
import { gateFor } from '@/components/site/FeatureGate';
import { getOrCreateReading, periodWindow } from '@/lib/predictions/generate';
import { topSignals, type PeriodName, type Signal } from '@/lib/predictions/signals';
import { SignalList } from '@/components/predictions/SignalList';
import type { BirthProfile } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const PERIODS: Record<PeriodName, { feature: string; label: string; sanskrit: string }> = {
  day: { feature: 'daily_reading', label: 'Today', sanskrit: 'Dina' },
  week: { feature: 'weekly_reading', label: 'This week', sanskrit: 'Saptāha' },
  month: { feature: 'monthly_reading', label: 'This month', sanskrit: 'Māsa' },
  year: { feature: 'yearly_reading', label: 'This year', sanskrit: 'Varṣa' },
};

function isPeriod(value: string): value is PeriodName {
  return value in PERIODS;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  const meta = isPeriod(period) ? PERIODS[period] : null;
  return { title: meta ? `${meta.label} reading` : 'Reading', robots: { index: false } };
}

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();

  const meta = PERIODS[period];

  // Checked before anything is generated. Refusing after paying for a model
  // call would be the wrong order.
  const gate = await gateFor(meta.feature, `/dashboard/readings/${period}`);
  if (gate) return gate;

  const user = await getUser();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at')
    .limit(1);

  const saved = ((rows as BirthProfile[] | null) ?? [])[0] ?? null;

  if (!saved) {
    return (
      <div className="max-w-xl">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Save a chart first and this will work.
        </p>
        <Link href="/tools/kundli" className="mt-4 inline-block text-sm" style={{ color: 'var(--color-gold-400)' }}>
          Cast a chart
        </Link>
      </div>
    );
  }

  const [hour, minute] = (saved.birth_time ?? '12:00').split(':').map(Number);
  const [year, month, day] = saved.birth_date.split('-').map(Number);

  const result = await getOrCreateReading({
    period,
    birthProfileId: saved.id,
    birth: {
      year,
      month,
      day,
      hour,
      minute,
      timeUnknown: saved.time_unknown,
      place: {
        name: saved.place_name,
        latitude: saved.latitude,
        longitude: saved.longitude,
        timezone: saved.timezone,
      },
    },
  });

  const window = periodWindow(period);
  const signals = topSignals(result.signals) as Signal[];
  const reading = result.reading;

  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href="/dashboard/readings" style={{ color: 'var(--color-gold-400)' }}>
          Readings
        </Link>
      </p>

      <p className="eyebrow mt-4">{meta.sanskrit}</p>
      <h1 className="font-display mt-2 text-3xl" style={{ color: 'var(--text-primary)' }}>
        {meta.label}
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {DateTime.fromJSDate(window.start).toFormat('d LLLL yyyy')}
        {period !== 'day' &&
          ` to ${DateTime.fromJSDate(new Date(window.end.getTime() - 86_400_000)).toFormat('d LLLL yyyy')}`}
        {' · '}
        {saved.label}
      </p>

      {/* The writing, when there is any to show. */}
      {reading?.body && reading.state === 'published' && (
        <section className="prose-vedic mt-9 max-w-2xl">
          {reading.body.split(/\n{2,}/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
      )}

      {reading && reading.state !== 'published' && (
        <p
          className="mt-9 max-w-2xl rounded-lg border-l-2 py-3 pl-4 pr-3 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--color-gold-600)',
            background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          This reading is written and waiting to be read over before it is
          released. Longer readings are always checked by hand. The findings it
          was built from are below in the meantime, and they do not change.
        </p>
      )}

      {!reading && (
        <p
          className="mt-9 max-w-2xl rounded-lg border-l-2 py-3 pl-4 pr-3 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--border-strong)',
            color: 'var(--text-secondary)',
          }}
        >
          {result.writerConfigured
            ? 'The written summary could not be produced just now. The findings below are the substance of it and are complete.'
            : 'Written summaries are switched off in this deployment. Everything below is what a summary would be built from.'}
        </p>
      )}

      {/* Always shown, prose or not. This is the part that can be checked. */}
      <section className="mt-12">
        <h2 className="eyebrow">What the engine found</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Each line is a fact about the chart during this window, with the
          classical rule beside it. Nothing in the writing above is allowed to go
          beyond this list.
        </p>
        <div className="mt-5 max-w-2xl">
          <SignalList signals={signals} />
        </div>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="eyebrow">Where this stands</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Ascendant">{result.signals.context.ascendant}</Row>
          <Row label="Moon sign">{result.signals.context.moonRashi}</Row>
          <Row label="Running dasha">{result.signals.context.dasha}</Row>
          <Row label="Sade Sati">
            {result.signals.context.sadeSatiPhase
              ? `${result.signals.context.sadeSatiPhase} phase`
              : 'Not running'}
          </Row>
        </dl>
      </section>

      <p className="mt-12 max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        A reading describes tendencies, not certainties, and it is not a
        substitute for medical, legal or financial advice. Where something here
        touches your health, a doctor is the person to ask.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="text-right" style={{ color: 'var(--text-primary)' }}>
        {children}
      </dd>
    </div>
  );
}
