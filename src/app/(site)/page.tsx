import Link from 'next/link';

import { BirthForm } from '@/components/forms/BirthForm';
import { SITE, TOOL_LINKS } from '@/lib/site';
import { getDefaultChart, withChart } from '@/lib/astro/current-chart';
import { HeroYantra } from '@/components/site/HeroYantra';
import { Shloka } from '@/components/ornament/Shloka';
import { Ganesha, OrnamentRule } from '@/components/ornament/Ornaments';
import { Parallax, Reveal } from '@/components/motion/Reveal';

export default async function HomePage() {
  /*
    The saved chart, so the list below links straight to it. Somebody who has
    saved a chart and comes back to the home page should be one tap from
    reading it, not one tap from typing their birth details in again.
  */
  const chart = await getDefaultChart();

  return (
    <>
      <Reveal />
      <Parallax selector="#hero-yantra" strength={0.1} />

      {/* ================================================================ Hero */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="starfield starfield-slow" aria-hidden />

        {/* Light source behind the figure. */}
        <div
          aria-hidden
          className="aura pointer-events-none absolute right-[-10%] top-[-8%] -z-10 h-[46rem] w-[46rem] rounded-full blur-[80px]"
          style={{
            background:
              'radial-gradient(circle, var(--aura-warm), transparent 62%)',
          }}
        />
        {/* A cold counter-light, so the warm side has something to read against. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] left-[-15%] -z-10 h-[36rem] w-[36rem] rounded-full blur-[90px]"
          style={{
            background:
              'radial-gradient(circle, var(--aura-cool), transparent 65%)',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pt-20">
          <div>
            {/* The invocation. Ganesha is addressed before any undertaking is
                begun, and casting a chart is one, so the site opens with it. */}
            <div
              className="mb-7 flex items-center gap-2.5"
              data-reveal
              style={{ color: 'var(--color-gold-400)' }}
            >
              <Ganesha size={26} className="shrink-0" />
              <p className="text-[0.8rem] leading-snug" style={{ color: 'var(--color-gold-400)' }}>
                <span lang="sa" style={{ fontFamily: 'var(--font-devanagari), serif' }}>
                  वक्रतुण्ड महाकाय
                </span>
                <span style={{ color: 'var(--text-muted)' }}> · a beginning without obstacles</span>
              </p>
            </div>

            <p className="eyebrow" data-reveal>
              Jyotisa, the science of light
            </p>

            {/*
              The typographic centrepiece. Very large, tight leading, with the
              second line carrying the gold. Scale is what makes a page feel
              designed rather than assembled.
            */}
            <h1
              className="hero-title font-display mt-6 text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.98]"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="block" data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
                Your chart,
              </span>
              <span
                className="text-gold-leaf block"
                data-reveal
                style={{ '--reveal-delay': '160ms' } as React.CSSProperties}
              >
                calculated properly.
              </span>
            </h1>

            <p
              className="mt-8 max-w-md text-[1.0625rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
              data-reveal
            >
              Most chart sites round the numbers and hope. This one uses the
              Swiss Ephemeris, applies the time zone that was actually in force
              on the day you were born, and shows you its working.
            </p>

            {/*
              One quiet link rather than a section.

              The argument for the calculations used to be made here, twice over:
              a strip of large figures and then three boxed columns. It is a
              technical claim and it needs room, so it has its own page now, and
              the reader who does not care is not made to scroll past it.
            */}
            <p
              className="mt-5 text-sm"
              data-reveal
              style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
            >
              <Link
                href="/method"
                className="inline-flex items-center gap-1.5 transition-colors duration-300"
                style={{ color: 'var(--color-gold-400)' }}
              >
                How the chart is calculated
                <span aria-hidden>→</span>
              </Link>
            </p>

            <div
              className="mt-10 flex flex-wrap items-center gap-4"
              data-reveal
              style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            >
              <Link href="/tools/kundli" className="group relative overflow-hidden rounded-full">
                <span
                  className="relative z-10 block px-8 py-4 text-sm font-medium tracking-wide"
                  style={{ color: '#150e00' }}
                >
                  Cast my chart, free
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500) 55%, var(--color-gold-400))',
                  }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full transition-transform duration-[900ms] group-hover:translate-x-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  }}
                />
              </Link>

              <Link
                href="/services"
                className="group flex items-center gap-2 text-sm transition-colors duration-300"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="border-b pb-0.5" style={{ borderColor: 'var(--border-strong)' }}>
                  Sit down with me instead
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: 'var(--color-gold-400)' }}
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          <div id="hero-yantra" className="relative mx-auto w-full max-w-lg will-change-transform">
            <HeroYantra />
          </div>
        </div>

        {/* Scroll cue. Small, quiet, and it stops once you have scrolled. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:block"
        >
          <div
            className="h-12 w-px"
            style={{
              background:
                'linear-gradient(180deg, transparent, var(--color-gold-500), transparent)',
            }}
          />
        </div>
      </section>

      {/* ============================================================== Tools */}
      <section className="mx-auto max-w-6xl px-5 py-28">
        <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow" data-reveal>
              Free to use
            </p>
            <h2
              className="font-display mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.05]"
              style={{ color: 'var(--text-primary)' }}
              data-reveal
            >
              Study your own chart first.
            </h2>
            <p
              className="mt-6 text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
              data-reveal
            >
              These run the same calculations I use in a paid reading. They are
              free because a chart you can check yourself is worth more than one
              you are asked to take on trust. No account, no email.
            </p>
          </div>

          {/*
            An editorial list rather than a grid of equal cards. Numbered rows
            with a rule between them read as considered; a four by two grid of
            identical boxes reads as filler.
          */}
          <ul>
            {TOOL_LINKS.map((tool, i) => (
              <li key={tool.href} data-reveal style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties}>
                <Link
                  href={withChart(tool.href, chart)}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-t py-7 transition-colors duration-500 sm:gap-6"
                >
                  <span
                    className="numeric text-sm"
                    style={{ color: 'var(--color-gold-600)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span
                        className="font-display text-2xl transition-colors duration-300 group-hover:text-[var(--color-gold-200)]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {tool.label}
                      </span>
                      <span
                        className="font-quote text-base italic"
                        style={{ color: 'var(--color-gold-500)' }}
                      >
                        {tool.sanskrit}
                      </span>
                    </span>
                    <span
                      className="mt-2 block max-w-lg text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tool.description}
                    </span>
                  </span>

                  <span
                    aria-hidden
                    className="translate-x-0 text-lg transition-transform duration-500 group-hover:translate-x-2"
                    style={{
                      color: 'var(--color-gold-400)',
                      transitionTimingFunction: 'var(--ease-out-expo)',
                    }}
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================================= Quick cast */}
      <section className="mx-auto max-w-6xl px-5 py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div data-reveal="left">
            <h2
              className="font-display mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.05]"
              style={{ color: 'var(--text-primary)' }}
            >
              Start with your own.
            </h2>
            <p
              className="mt-6 max-w-md text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your birth details, and you get the full rashi chart, your
              nakshatra and pada, every divisional chart, and the dasha period
              you are running right now.
            </p>
            <p
              className="mt-4 max-w-md text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Do not know your birth time? Cast it anyway. The chart will mark
              clearly which parts you can rely on and which you cannot, rather
              than presenting a guess as fact.
            </p>
          </div>

          <div className="surface-card p-7 sm:p-9" data-reveal="scale">
            <BirthForm action="/tools/kundli" submitLabel="Cast my chart" />
          </div>
        </div>
      </section>

      {/* ============================================================ Closing */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="aura pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          style={{
            background:
              'radial-gradient(circle, var(--aura-warm), transparent 65%)',
          }}
        />

        <div className="mx-auto max-w-3xl px-5 py-32 text-center">
          {/* The verse the whole site is named for: from darkness to light. */}
          <div data-reveal>
            <Shloka which="jyoti" />
          </div>

          <div data-reveal>
            <OrnamentRule className="mt-14" />
          </div>

          <blockquote
            className="font-quote mt-14 text-[clamp(1.5rem,3.4vw,2.375rem)] italic leading-[1.35]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            “A chart does not tell you what will happen. It tells you what you
            are working with.”
          </blockquote>

          <div className="rule-gold mx-auto mt-12 max-w-[14rem]" />

          <p
            className="mt-12 text-[0.9375rem]"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            When you want the whole chart read properly, not a paragraph
            generated from your sun sign.
          </p>

          <Link
            href="/services"
            className="group mt-7 inline-flex items-center gap-2.5 rounded-full border px-8 py-4 text-sm transition-colors duration-500"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--color-gold-200)',
            }}
            data-reveal
          >
            See what a reading involves
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>

          <p className="mt-10 text-xs" style={{ color: 'var(--text-muted)' }}>
            Day to day thoughts on{' '}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
              style={{ color: 'var(--color-gold-400)' }}
            >
              Instagram
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

/** A single figure in the proof band. Large numeral, small caption. */
