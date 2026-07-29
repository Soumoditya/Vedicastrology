import Link from 'next/link';

import { BirthForm } from '@/components/forms/BirthForm';
import { SITE, TOOL_LINKS } from '@/lib/site';
import { Yantra } from '@/components/site/Yantra';

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="starfield" aria-hidden />

        {/* Warm glow rising from behind the yantra. */}
        <div
          aria-hidden
          className="aura pointer-events-none absolute left-1/2 top-0 -z-10 h-[38rem] w-[38rem]
                     -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--color-gold-500) 18%, transparent), transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: 'var(--color-gold-600)' }}
              >
                Jyotiṣa · The science of light
              </p>

              <h1
                className="font-display mt-5 text-[2.6rem] leading-[1.08] sm:text-6xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Read your chart
                <br />
                <span className="text-gold-leaf">as it truly stands.</span>
              </h1>

              <p
                className="mt-6 max-w-md text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Classical Vedic astrology, calculated with the Swiss Ephemeris
                to the arc-second — not estimated. Cast your birth chart free,
                or sit down with me for a reading that takes your whole chart
                into account.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/tools/kundli"
                  className="group relative overflow-hidden rounded-lg px-6 py-3.5 text-sm font-medium"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
                    color: '#160f00',
                  }}
                >
                  <span className="relative z-10">Cast my chart — free</span>
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full transition-transform duration-700
                               group-hover:translate-x-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                    }}
                  />
                </Link>

                <Link
                  href="/services"
                  className="rounded-lg border px-6 py-3.5 text-sm transition-colors duration-300"
                  style={{
                    borderColor: 'var(--border-strong)',
                    color: 'var(--color-gold-200)',
                  }}
                >
                  Book a consultation
                </Link>
              </div>

              <dl className="mt-12 grid max-w-md grid-cols-3 gap-5">
                <Stat value="Arc-second" label="Ephemeris precision" />
                <Stat value="16" label="Divisional charts" />
                <Stat value="1800–2400" label="Years covered" />
              </dl>
            </div>

            {/* The yantra stands in for a chart without pretending to be one. */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <Yantra />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Quick cast */}
      <section className="relative border-y" style={{ background: 'var(--surface-sunken)' }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.26em]"
              style={{ color: 'var(--color-gold-600)' }}
            >
              Start here
            </p>
            <h2
              className="font-display mt-3 text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Your chart in about ten seconds
            </h2>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              No account, no email, nothing to pay. Enter your birth details and
              you’ll get the full rashi chart, your nakshatra, every divisional
              chart and your running dasha period.
            </p>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Don’t know your birth time? That’s fine — cast it anyway. The
              chart will show clearly which parts you can rely on and which you
              can’t.
            </p>
          </div>

          <div className="surface-card p-6 sm:p-7">
            <BirthForm action="/tools/kundli" submitLabel="Cast my chart" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Tools */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.26em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Free tools
          </p>
          <h2
            className="font-display mt-3 text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Everything you need to study your own chart
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            These are the same calculations I use in a paid reading. They’re
            free because a chart you can see for yourself is worth more than one
            you’re asked to take on trust.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_LINKS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="surface-card group relative overflow-hidden p-5 transition-all duration-500"
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
              <p
                className="font-quote text-sm italic"
                style={{ color: 'var(--color-gold-600)' }}
              >
                {tool.sanskrit}
              </p>
              <h3
                className="font-display mt-1 text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                {tool.label}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tool.description}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-xs transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ color: 'var(--color-gold-400)' }}
              >
                Open
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
      </section>

      {/* -------------------------------------------------------------- Accuracy */}
      <section className="relative border-y" style={{ background: 'var(--surface-sunken)' }}>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-10 max-w-2xl">
            <p
              className="text-xs uppercase tracking-[0.26em]"
              style={{ color: 'var(--color-gold-600)' }}
            >
              Why the numbers can be trusted
            </p>
            <h2
              className="font-display mt-3 text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Most chart sites are quietly wrong
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Pillar title="The right ephemeris">
              Positions come from the Swiss Ephemeris — the same source serious
              Indian software uses — with its full-precision data files, not a
              simplified approximation.
            </Pillar>
            <Pillar title="The right time">
              India ran on +05:21:10 before 1906 and on +06:30 through the war
              years. Sites that assume +05:30 get every older chart wrong, in a
              way that still looks plausible. Historical offsets are applied
              here automatically.
            </Pillar>
            <Pillar title="The right sunrise">
              Panchang uses the Hindu convention — centre of the disc, no
              refraction. That differs from the Western rule by a few minutes,
              which is often enough to change which tithi a day belongs to.
            </Pillar>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Closing */}
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <blockquote
          className="font-quote text-2xl italic leading-relaxed sm:text-3xl"
          style={{ color: 'var(--text-secondary)' }}
        >
          “A chart does not tell you what will happen. It tells you what you are
          working with.”
        </blockquote>

        <div className="rule-gold mx-auto mt-10 max-w-xs" />

        <p className="mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ready for a proper reading of your chart?
        </p>
        <Link
          href="/services"
          className="mt-5 inline-block rounded-lg px-7 py-3.5 text-sm font-medium"
          style={{
            background:
              'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
            color: '#160f00',
          }}
        >
          See consultations
        </Link>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
          Or follow along on Instagram at{' '}
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-gold-400)' }}
          >
            @{SITE.instagram}
          </a>
        </p>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt
        className="font-display text-lg"
        style={{ color: 'var(--color-gold-300)' }}
      >
        {value}
      </dt>
      <dd
        className="mt-0.5 text-[0.7rem] leading-tight"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </dd>
    </div>
  );
}

function Pillar({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="font-display text-lg"
        style={{ color: 'var(--color-gold-200)' }}
      >
        {title}
      </h3>
      <p
        className="mt-2.5 text-sm leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </p>
    </div>
  );
}
