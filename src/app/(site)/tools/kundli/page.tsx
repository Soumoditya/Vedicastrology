import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { castChart, isWaxingMoon, moonRashi } from '@/lib/astro/chart';
import { buildVarga, COMMON_VARGAS } from '@/lib/astro/divisional';
import { buildVimshottari, dashaAt, formatBalance } from '@/lib/astro/dasha';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { chartToRenderData, vargaToRenderData } from '@/lib/chart-render/adapt';
import {
  DIGNITY_LABEL,
} from '@/lib/astro/dignity';
import {
  GRAHA_NAMES_SA,
  NAKSHATRA_NAMES,
  RASHI_NAMES_EN,
} from '@/lib/astro/constants';
import { formatDms, formatPosition } from '@/lib/astro/zodiac';
import { ephemerisMode } from '@/lib/astro/ephemeris';
import { BirthForm } from '@/components/forms/BirthForm';
import {
  ChartWorkspace,
  type WorkspaceHouse,
  type WorkspaceVarga,
} from '@/components/chart/ChartWorkspace';

export const metadata: Metadata = {
  title: 'Birth Chart (Kundli)',
  description:
    'Cast an accurate Vedic birth chart with houses, nakshatras, dignities, ' +
    'divisional charts and Vimshottari dasha. Free, no account needed.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KundliPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (!hasBirthQuery(params)) {
    return <KundliIntro />;
  }

  let parsed;
  try {
    parsed = parseBirthQuery(params);
  } catch {
    return <KundliIntro error="Those birth details weren’t valid. Please enter them again." />;
  }

  const { birth, settings, displayName } = parsed;
  const chart = castChart(birth, { settings });
  const zone = chart.meta.timezone;

  // Divisional charts.
  const vargas: WorkspaceVarga[] = COMMON_VARGAS.map((code) => {
    if (code === 'D1') {
      return {
        code,
        name: 'Rashi',
        signification: 'The physical body and the life as a whole',
        data: chartToRenderData(chart),
      };
    }
    const varga = buildVarga(chart, code);
    return {
      code,
      name: varga.name,
      signification: varga.signification,
      data: vargaToRenderData(varga, chart),
    };
  });

  const houses: WorkspaceHouse[] = chart.houses.map((h) => ({
    house: h.house,
    rashi: h.rashi,
    lord: h.lord,
    occupants: chart.planets
      .filter((p) => p.house === h.house)
      .map((p) => ({
        graha: p.graha,
        label: `${p.graha} ${formatDms(p.degreeInRashi, false)}`,
      })),
    aspectedBy: h.aspectedBy,
  }));

  const dasha = buildVimshottari(chart, { maxLevel: 3 });
  const active = dashaAt(dasha, new Date());

  const moon = chart.byGraha.Moon;
  const local = DateTime.fromISO(chart.meta.utcISO).setZone(zone);

  return (
    <div className="relative">
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <header className="mb-10">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Janma Kundli
          </p>
          <h1
            className="font-display mt-2 text-3xl sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayName ? `${displayName}’s chart` : 'Birth chart'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {local.toFormat('d LLLL yyyy')}
            {!chart.meta.timeUnknown && ` · ${local.toFormat('HH:mm')}`}
            {' · '}
            {birth.place.name}
          </p>
        </header>

        {chart.meta.timeUnknown && (
          <Notice tone="warn">
            The birth time wasn’t known, so this chart is cast for noon. The
            grahas’ signs and nakshatras are reliable, but the ascendant, the
            houses and all dasha dates are not — treat them as provisional.
          </Notice>
        )}

        {chart.meta.historicalOffset && (
          <Notice tone="info">
            This date used a historical time offset of{' '}
            {formatOffset(chart.meta.utcOffsetMinutes)} in {zone}, not today’s.
            It has been applied. Charts from sites that assume the modern offset
            will differ.
          </Notice>
        )}

        {/* Summary strip */}
        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Ascendant"
            value={RASHI_NAMES_EN[chart.ascendant.rashi]}
            detail={formatDms(chart.ascendant.degreeInRashi, false)}
          />
          <SummaryCard
            label="Moon sign"
            value={RASHI_NAMES_EN[moonRashi(chart)]}
            detail={isWaxingMoon(chart) ? 'Waxing' : 'Waning'}
          />
          <SummaryCard
            label="Nakshatra"
            value={NAKSHATRA_NAMES[moon.nakshatra]}
            detail={`Pada ${moon.pada} · ${moon.nakshatraLord}`}
          />
          <SummaryCard
            label="Current dasha"
            value={active ? active.maha.lord : '—'}
            detail={active?.antar ? `Antar: ${active.antar.lord}` : undefined}
          />
        </section>

        {/* Charts */}
        <section className="mb-14">
          <ChartWorkspace vargas={vargas} houses={houses} />
        </section>

        {/* Planet table */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Graha Sphuta"
            title="Planetary positions"
            note={`${chart.meta.settings.ayanamsa === 'lahiri' ? 'Lahiri' : chart.meta.settings.ayanamsa} ayanamsa · ${chart.meta.ayanamsaValue.toFixed(4)}°`}
          />

          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs uppercase tracking-[0.1em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Th>Graha</Th>
                  <Th>Position</Th>
                  <Th>House</Th>
                  <Th>Nakshatra</Th>
                  <Th>Pada</Th>
                  <Th>Dignity</Th>
                  <Th>State</Th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((p) => (
                  <tr
                    key={p.graha}
                    className="border-b last:border-0 transition-colors duration-200"
                  >
                    <Td>
                      <span style={{ color: 'var(--text-primary)' }}>{p.graha}</span>
                      <span
                        className="ml-1.5 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {GRAHA_NAMES_SA[p.graha as keyof typeof GRAHA_NAMES_SA]}
                      </span>
                    </Td>
                    <Td mono>{formatPosition(p.longitude)}</Td>
                    <Td>{p.house}</Td>
                    <Td>{NAKSHATRA_NAMES[p.nakshatra]}</Td>
                    <Td>{p.pada}</Td>
                    <Td>
                      <span
                        style={{
                          color:
                            p.dignity === 'exalted'
                              ? 'var(--color-benefic)'
                              : p.dignity === 'debilitated'
                                ? 'var(--color-malefic)'
                                : 'var(--text-secondary)',
                        }}
                      >
                        {DIGNITY_LABEL[p.dignity]}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex gap-1.5 text-xs">
                        {p.retrograde && (
                          <Tag tone="warn" title="Retrograde">
                            ℞
                          </Tag>
                        )}
                        {p.combust && (
                          <Tag tone="danger" title="Combust — too close to the Sun">
                            Astangata
                          </Tag>
                        )}
                        {!p.retrograde && !p.combust && (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dasha */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Vimśottarī Daśā"
            title="Planetary periods"
            note={formatBalance(dasha)}
          />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dasha.periods.map((p) => {
              const isActive = active?.maha.lord === p.lord;
              return (
                <div
                  key={`${p.lord}-${p.start.toISOString()}`}
                  className="surface-card px-4 py-3"
                  style={
                    isActive
                      ? {
                          borderColor: 'var(--border-strong)',
                          background:
                            'color-mix(in oklab, var(--color-gold-500) 8%, var(--surface-raised))',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="font-display"
                      style={{
                        color: isActive
                          ? 'var(--color-gold-200)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {p.lord}
                    </span>
                    {isActive && (
                      <span
                        className="text-[0.65rem] uppercase tracking-[0.14em]"
                        style={{ color: 'var(--color-gold-500)' }}
                      >
                        Running
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {DateTime.fromJSDate(p.start).setZone(zone).toFormat('d LLL yyyy')}
                    {' → '}
                    {DateTime.fromJSDate(p.end).setZone(zone).toFormat('d LLL yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Provenance — worth stating plainly, since accuracy is the point. */}
        <section
          className="surface-card px-5 py-4 text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Calculated with the Swiss Ephemeris
          {ephemerisMode() === 'swiss' ? '' : ' (built-in precision mode)'} using
          the {chart.meta.settings.ayanamsa === 'lahiri' ? 'Lahiri (Chitrapaksha)' : chart.meta.settings.ayanamsa}{' '}
          ayanamsa at {chart.meta.ayanamsaValue.toFixed(6)}°, whole-sign houses
          and the {chart.meta.settings.nodeType} lunar node. Local time was
          converted to Universal Time as {formatOffset(chart.meta.utcOffsetMinutes)}{' '}
          for {zone}, using the historical rule in force on that date.
        </section>

        {/* Recast */}
        <section className="mt-12">
          <SectionHeading eyebrow="Another chart" title="Cast a different chart" />
          <div className="surface-card max-w-xl p-6">
            <BirthForm action="/tools/kundli" submitLabel="Cast the chart" />
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing state
// ---------------------------------------------------------------------------

function KundliIntro({ error }: { error?: string }) {
  return (
    <div className="relative">
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <div className="text-center">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Janma Kundli
          </p>
          <h1
            className="font-display mt-3 text-4xl sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Your birth chart
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg text-sm leading-relaxed sm:text-base"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cast an accurate Vedic chart in the North Indian style — with
            nakshatras, dignities, divisional charts and your Vimshottari dasha.
            No account needed.
          </p>
        </div>

        {error && (
          <div className="mt-8">
            <Notice tone="warn">{error}</Notice>
          </div>
        )}

        <div className="surface-card mt-10 p-6 sm:p-8">
          <BirthForm action="/tools/kundli" submitLabel="Cast the chart" />
        </div>

        <p
          className="mt-6 text-center text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Computed with the Swiss Ephemeris and the Lahiri ayanamsa — the same
          basis used by classical Indian software. Historical time zones,
          including India’s wartime and pre-1906 offsets, are applied
          automatically.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="surface-card px-4 py-3.5">
      <p
        className="text-[0.65rem] uppercase tracking-[0.16em]"
        style={{ color: 'var(--color-gold-600)' }}
      >
        {label}
      </p>
      <p
        className="font-display mt-1.5 text-xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-5">
      <p
        className="text-xs uppercase tracking-[0.24em]"
        style={{ color: 'var(--color-gold-600)' }}
      >
        {eyebrow}
      </p>
      <h2
        className="font-display mt-1.5 text-2xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      {note && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {note}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: 'info' | 'warn';
  children: React.ReactNode;
}) {
  const color = tone === 'warn' ? 'var(--color-saffron-400)' : 'var(--color-gold-400)';
  return (
    <div
      className="mb-6 rounded-lg border px-4 py-3 text-sm leading-relaxed"
      style={{
        borderColor: `color-mix(in oklab, ${color} 34%, transparent)`,
        background: `color-mix(in oklab, ${color} 7%, transparent)`,
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`px-4 py-2.5 ${mono ? 'tabular-nums' : ''}`}
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </td>
  );
}

function Tag({
  tone,
  title,
  children,
}: {
  tone: 'warn' | 'danger';
  title: string;
  children: React.ReactNode;
}) {
  const color = tone === 'danger' ? 'var(--color-malefic)' : 'var(--color-saffron-400)';
  return (
    <span
      title={title}
      className="rounded px-1.5 py-0.5"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.floor(abs % 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
