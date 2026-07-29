import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { computePanchang } from '@/lib/astro/panchang';
import { RASHI_NAMES_EN, NAKSHATRA_DEITY, NAKSHATRA_SYMBOL } from '@/lib/astro/constants';
import { PlacePicker } from '@/components/forms/PlacePicker';
import { POPULAR_PLACES } from '@/lib/geo/geocode';
import { timezoneFor } from '@/lib/astro/time';
import type { TimeWindow } from '@/lib/astro/types';

export const metadata: Metadata = {
  title: 'Today’s Panchang',
  description:
    'Tithi, nakshatra, yoga and karana with true Hindu sunrise, Rahu Kaal, ' +
    'Gulika, Yamaganda and Abhijit muhurta for any place and date.',
};

// The panchang changes through the day, so it is recomputed per request.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KOLKATA = POPULAR_PLACES.find((p) => p.name === 'Kolkata')!;

export default async function PanchangPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const lat = Number(params.lat ?? KOLKATA.latitude);
  const lon = Number(params.lon ?? KOLKATA.longitude);
  const placeName = (params.place as string) ?? KOLKATA.label;
  const timezone = (params.tz as string) ?? timezoneFor(lat, lon);

  // Default to today *at the chosen place*, which may already be tomorrow
  // there — the whole point of a panchang is that it is local.
  const today = DateTime.now().setZone(timezone);
  const dateStr = (params.d as string) ?? today.toFormat('yyyy-MM-dd');
  const [year, month, day] = dateStr.split('-').map(Number);

  const place = { name: placeName, latitude: lat, longitude: lon, timezone };
  const p = computePanchang({ year, month, day }, place);

  const fmt = (d: Date | null | undefined) =>
    d ? DateTime.fromJSDate(d).setZone(timezone).toFormat('HH:mm') : '—';

  const fmtWindow = (w: TimeWindow | null) =>
    w ? `${fmt(w.start)} – ${fmt(w.end)}` : 'Not observed today';

  const displayDate = DateTime.fromObject({ year, month, day }, { zone: timezone });
  const prev = displayDate.minus({ days: 1 }).toFormat('yyyy-MM-dd');
  const next = displayDate.plus({ days: 1 }).toFormat('yyyy-MM-dd');
  const baseQuery = `lat=${lat}&lon=${lon}&tz=${encodeURIComponent(timezone)}&place=${encodeURIComponent(placeName)}`;

  return (
    <div className="relative">
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <header className="mb-9">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Pañcāṅga · The five limbs
          </p>
          <h1
            className="font-display mt-2 text-3xl sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayDate.toFormat('cccc, d LLLL yyyy')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {placeName} · {timezone}
          </p>
        </header>

        {/* Date and place controls */}
        <div className="surface-card mb-9 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2">
            <NavLink href={`/tools/panchang?d=${prev}&${baseQuery}`} label="Previous day">
              ‹
            </NavLink>
            <form action="/tools/panchang" method="get" className="flex items-end gap-2">
              <input type="hidden" name="lat" value={lat} />
              <input type="hidden" name="lon" value={lon} />
              <input type="hidden" name="tz" value={timezone} />
              <input type="hidden" name="place" value={placeName} />
              <div>
                <label
                  htmlFor="panchang-date"
                  className="mb-1.5 block text-xs uppercase tracking-[0.12em]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Date
                </label>
                <input
                  id="panchang-date"
                  type="date"
                  name="d"
                  defaultValue={dateStr}
                  className="rounded-lg border bg-[var(--surface-sunken)] px-3 py-2 text-sm [color-scheme:dark]"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg border px-4 py-2 text-sm"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--color-gold-200)',
                }}
              >
                Go
              </button>
            </form>
            <NavLink href={`/tools/panchang?d=${next}&${baseQuery}`} label="Next day">
              ›
            </NavLink>
          </div>

          <div className="flex-1 sm:max-w-xs">
            <PlacePicker
              action="/tools/panchang"
              extraParams={{ d: dateStr }}
              currentLabel={placeName}
            />
          </div>
        </div>

        {/* The five limbs */}
        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Limb
            label="Tithi"
            value={`${p.tithi.paksha} ${p.tithi.name}`}
            detail={p.tithi.endsAt ? `until ${fmt(p.tithi.endsAt)}` : undefined}
            progress={p.tithi.elapsed}
          />
          <Limb
            label="Nakshatra"
            value={p.nakshatra.name}
            detail={p.nakshatra.endsAt ? `until ${fmt(p.nakshatra.endsAt)}` : undefined}
            progress={p.nakshatra.elapsed}
          />
          <Limb
            label="Yoga"
            value={p.yoga.name}
            detail={p.yoga.endsAt ? `until ${fmt(p.yoga.endsAt)}` : undefined}
            progress={p.yoga.elapsed}
          />
          <Limb
            label="Karana"
            value={p.karana.name}
            detail={p.karana.endsAt ? `until ${fmt(p.karana.endsAt)}` : undefined}
            progress={p.karana.elapsed}
          />
          <Limb label="Vara" value={p.vara.nameEn} detail={`Ruled by ${p.vara.lord}`} />
          <Limb
            label="Moon sign"
            value={RASHI_NAMES_EN[p.moonSign]}
            detail={`Sun in ${RASHI_NAMES_EN[p.sunSign]}`}
          />
        </section>

        {/* Sun and Moon */}
        <section className="mb-10">
          <Heading eyebrow="Sūrya & Candra" title="Rise and set" />
          <div className="grid gap-3 sm:grid-cols-4">
            <Fact label="Sunrise" value={fmt(p.sunrise)} />
            <Fact label="Sunset" value={fmt(p.sunset)} />
            <Fact label="Moonrise" value={fmt(p.moonrise)} />
            <Fact label="Moonset" value={fmt(p.moonset)} />
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Sunrise uses the Hindu convention — the centre of the Sun’s disc,
            without atmospheric refraction. Western almanacs use the upper limb
            with refraction and will read two to four minutes earlier.
          </p>
        </section>

        {/* Muhurta */}
        <section className="mb-10">
          <Heading
            eyebrow="Muhūrta"
            title="Auspicious and inauspicious windows"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Window
              label="Rahu Kaal"
              value={fmtWindow(p.muhurta.rahuKaal)}
              tone="bad"
              note="Avoid beginning anything new."
            />
            <Window
              label="Yamaganda"
              value={fmtWindow(p.muhurta.yamaganda)}
              tone="bad"
              note="Unfavourable for important undertakings."
            />
            <Window
              label="Gulika Kaal"
              value={fmtWindow(p.muhurta.gulikaKaal)}
              tone="bad"
              note="Traditionally avoided for auspicious acts."
            />
            <Window
              label="Abhijit Muhurta"
              value={fmtWindow(p.muhurta.abhijit)}
              tone="good"
              note="The most favourable window of the day. Not observed on Wednesdays."
            />
            <Window
              label="Brahma Muhurta"
              value={fmtWindow(p.muhurta.brahmaMuhurta)}
              tone="good"
              note="Before dawn — best for study, meditation and practice."
            />
          </div>
        </section>

        {/* Nakshatra detail */}
        <section className="surface-card p-5">
          <Heading eyebrow="Today’s nakshatra" title={p.nakshatra.name} />
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                Ruling graha
              </dt>
              <dd className="mt-1" style={{ color: 'var(--text-primary)' }}>
                {p.nakshatra.lord}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                Deity
              </dt>
              <dd className="mt-1" style={{ color: 'var(--text-primary)' }}>
                {NAKSHATRA_DEITY[p.nakshatra.index]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                Symbol
              </dt>
              <dd className="mt-1" style={{ color: 'var(--text-primary)' }}>
                {NAKSHATRA_SYMBOL[p.nakshatra.index]}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Limb({
  label,
  value,
  detail,
  progress,
}: {
  label: string;
  value: string;
  detail?: string;
  progress?: number;
}) {
  return (
    <div className="surface-card p-4">
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
      {progress !== undefined && (
        <div
          className="mt-3 h-0.5 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--border-subtle)' }}
          role="presentation"
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background:
                'linear-gradient(90deg, var(--color-gold-600), var(--color-gold-300))',
            }}
          />
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p
        className="text-[0.65rem] uppercase tracking-[0.16em]"
        style={{ color: 'var(--color-gold-600)' }}
      >
        {label}
      </p>
      <p
        className="font-display mt-1.5 text-2xl tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

function Window({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: 'good' | 'bad';
  note: string;
}) {
  const color = tone === 'good' ? 'var(--color-benefic)' : 'var(--color-malefic)';
  return (
    <div className="surface-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="text-[0.65rem] uppercase tracking-[0.16em]"
          style={{ color: 'var(--color-gold-600)' }}
        >
          {label}
        </p>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      </div>
      <p
        className="mt-1.5 text-lg tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {note}
      </p>
    </div>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p
        className="text-xs uppercase tracking-[0.24em]"
        style={{ color: 'var(--color-gold-600)' }}
      >
        {eyebrow}
      </p>
      <h2
        className="font-display mt-1 text-2xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
    </div>
  );
}

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-lg"
      style={{ borderColor: 'var(--border-subtle)', color: 'var(--color-gold-300)' }}
    >
      {children}
    </a>
  );
}
