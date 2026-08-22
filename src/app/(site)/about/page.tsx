import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE } from '@/lib/site';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What a reading is, what a chart can and cannot tell you, and why every ' +
    'calculation on this site is free to check.',
};

/**
 * About page.
 *
 * Deliberately about the practice rather than a biography. The owner asked for
 * no personal details anywhere on the site, and there is a real advantage in
 * that: what convinces a sceptical reader is the working, not a claim of years
 * of experience.
 *
 * Rewritten because it was addressing the wrong reader. Three of its four
 * sections were engineering copy — where the ephemeris comes from, that India
 * ran on +05:21:10 before 1906, which clause of the AGPL obliges the source to
 * be public — and two of them said what `/method` already says at length.
 * Somebody who opens "About" on an astrology site is deciding whether to trust
 * a person with something they are worried about, and they were handed a
 * specification.
 *
 * So the method has gone back to `/method`, where it belongs and where it was
 * already written, and this page is about the reader's situation instead. That
 * is also the only way to be warm without a biography: write about them, not
 * about a practitioner who has asked not to appear.
 */
export default function AboutPage() {
  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <p className="eyebrow" data-reveal>About</p>
        <h1
          className="font-display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.04]"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          Your chart,
          <span className="text-gold-leaf block">read by a person.</span>
        </h1>

        <div className="prose-vedic mt-10" data-reveal>
          <p>
            Most people arrive here worried about one thing. A marriage being
            discussed. A job that will not settle. A year that has gone badly
            enough that somebody suggested getting the chart looked at. You do
            not have to explain why you came — that is a normal reason, and it
            is most of the reason anybody has ever consulted a chart.
          </p>

          <h2>What a chart can tell you</h2>
          <p>
            A chart describes what you are working with. Which house carries
            weight in your life, which graha is running its period right now,
            where the tradition says you have support and where you are pushing
            uphill. Read carefully, that is genuinely useful: it tells you which
            things are worth your effort this year and which are better left
            alone.
          </p>
          <p>
            What it will not do is tell you what you are going to decide. Nobody
            can hand you your future in a paragraph, and anyone offering to is
            selling something that is not jyotish.
          </p>

          <h2>What a reading is</h2>
          <p>
            Time spent with your whole chart, not a form letter. Weighing what
            is strong against what is not, and saying plainly what it means for
            the thing actually in front of you.
          </p>
          <p>
            It also means being told when astrology is the wrong tool. If what
            you are facing needs a doctor, a lawyer, or an honest conversation
            with the person it concerns, you will be told that rather than sold
            a session. That happens more often than the trade likes to admit.
          </p>

          <h2>Why all of this is free</h2>
          <p>
            Because a chart you can check yourself is worth more than one you
            are asked to take on trust.
          </p>
          <p>
            Vedic astrology has a credibility problem and most of it is
            self-inflicted: certainty nobody can deliver, paragraphs generated
            from a birth month, and the arithmetic kept out of sight. The tools
            here run the same calculations used in a paid reading, and they show
            their working — the ayanamsa, its exact value for your date, the
            time offset that was really in force on the day you were born. If
            the tradition has something real in it, it survives being checked.
            If a claim cannot survive that, it deserves to be dropped.
          </p>
          {/*
            The detail lives on /method, which is a page about exactly this and
            was already carrying it. Saying it twice is how two accounts of one
            thing quietly drift apart.
          */}
          <p>
            <Link href="/method" style={{ color: 'var(--color-gold-400)' }}>
              How the chart is calculated →
            </Link>
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
