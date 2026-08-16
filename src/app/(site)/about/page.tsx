import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE } from '@/lib/site';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'About',
  description:
    'How this site approaches Jyotish, and why the calculations are built the ' +
    'way they are.',
};

/**
 * About page.
 *
 * Deliberately about the practice and the method rather than a biography.
 * The owner asked for no personal details anywhere on the site, and there is
 * a real advantage in that: what convinces a sceptical reader is the working,
 * not a claim of years of experience.
 */
export default function AboutPage() {
  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <p className="eyebrow" data-reveal>About</p>
        <h1
          className="font-display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.04]"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          Jyotish, taken
          <span className="text-gold-leaf block">seriously.</span>
        </h1>

        <div className="prose-vedic mt-10" data-reveal>
          <p>
            Vedic astrology has a credibility problem, and most of it is
            self inflicted. Sites promise certainty they cannot deliver,
            generate paragraphs from a sun sign, and hide the arithmetic. Then
            people are surprised that thoughtful readers dismiss the whole
            subject.
          </p>
          <p>
            This site is built on the opposite bet. Show the working. Make the
            calculations free and checkable. Be plain about where a chart is
            reliable and where it is not. If the tradition has anything real in
            it, it survives that treatment. If a claim cannot survive being
            checked, it deserves to be dropped.
          </p>

          <h2>Where the numbers come from</h2>
          <p>
            Positions come from the Swiss Ephemeris with its full precision data
            files, the same source serious Indian software relies on. The
            ayanamsa is Lahiri, the Indian standard, and it is stated on every
            chart along with its exact value for your date.
          </p>
          <p>
            Local time is converted using the offset that was genuinely in force
            on your birth date, from the international time zone database. India
            ran on +05:21:10 before 1906 and +06:30 through the war years. A
            site that assumes +05:30 produces older charts that are wrong in
            every value while still looking entirely reasonable, and nothing on
            screen would tell you.
          </p>
          <p>
            The panchang uses the Hindu sunrise convention, centre of the disc
            and no atmospheric refraction, rather than the Western rule. The
            difference is a few minutes, which is regularly enough to change
            which tithi a day belongs to.
          </p>

          <h2>What a reading is</h2>
          <p>
            A chart describes what you are working with. It does not tell you
            what you will decide, and anyone offering certainty about your
            future is selling something else.
          </p>
          <p>
            A reading is time spent with your whole chart, weighing what is
            strong against what is not, and saying plainly what it means for the
            thing actually in front of you. Sometimes the honest answer is that
            astrology is not the right tool for the question, and you will be
            told that rather than sold a session.
          </p>

          <h2>Open by necessity, and by choice</h2>
          <p>
            The Swiss Ephemeris is licensed under the AGPL, which requires the
            source of anything built on it to be public. That obligation is met
            gladly. It means every claim on this page about how the calculations
            work can be checked by anyone who cares to look, rather than taken
            on trust.
          </p>
        </div>

        <div className="surface-card mt-12 p-6" data-reveal>
          <p className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Start with your own chart
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            It costs nothing and needs no account. Judge the work before
            deciding whether a reading is worth your money.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/kundli"
              className="rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
                color: '#150e00',
              }}
            >
              Cast my chart
            </Link>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-5 py-2.5 text-sm"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
            >
              Follow along
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
