import type { Metadata } from 'next';
import Link from 'next/link';

import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'How the chart is calculated',
  description:
    'The ephemeris, the historical Indian time offsets, the sunrise rule and ' +
    'the accuracy tests behind every chart on this site.',
};

/**
 * How the chart is calculated.
 *
 * This argument used to sit on the home page as three boxed columns, and before
 * that as a strip of large figures. Neither worked. The claim is a technical one
 * and it needs room to be made properly: a reader who cares about which
 * ephemeris is in use is not going to be satisfied by forty words in a card, and
 * a reader who does not care should not have the home page spent on it.
 *
 * It also stops the home page arguing from somebody else's failure. "A wrong
 * chart still looks like a perfectly good chart" is true and it is the reason
 * this page exists, but leading a home page with it puts a competitor's mistake
 * where the work should be.
 */
export default function MethodPage() {
  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <p className="eyebrow" data-reveal>
          Method
        </p>
        <h1
          className="font-display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.04]"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          How the chart is
          <span className="text-gold-leaf block">calculated.</span>
        </h1>

        <div className="prose-vedic mt-10" data-reveal>
          <p>
            A wrong chart looks exactly like a right one. Nothing on the screen
            tells you the ascendant was computed from the wrong moment, or that
            the ayanamsa used was a decimal approximation of the one you wanted.
            You find out years later, if at all. That is the reason this page
            exists, and the reason the working is shown rather than asserted.
          </p>

          <h2>The ephemeris</h2>
          <p>
            Positions come from the Swiss Ephemeris, with its full-precision data
            files bundled with the site rather than fetched or approximated. It is
            the same source the serious Indian desktop software uses. If those
            files ever went missing from a deployment the engine would fall back
            to the built-in Moshier ephemeris, which agrees to under a third of an
            arc-second, so a mishap would cost precision rather than correctness.
          </p>
          <p>
            The test suite asserts every graha longitude to <strong>one
            arc-second</strong> against values generated independently by the
            Swiss Ephemeris. That is the part worth knowing: a drift in the
            ayanamsa, the node type or the time handling fails the build instead
            of quietly shipping charts that look plausible.
          </p>

          <h2>The moment</h2>
          <p>
            India has not always kept the time it keeps now. Before 1906 the
            country ran on Madras Mean Time, +05:21:10, and from 1942 to 1945 on
            +06:30. Software that assumes +05:30 for every Indian birth produces
            charts that are wrong in every single value while still looking
            entirely ordinary — the ascendant lands in a plausible sign, the
            houses fill up, nothing announces the error.
          </p>
          <p>
            The offset actually in force on the day and at the place of birth is
            applied, from the IANA time zone database, including worldwide
            daylight saving and the ambiguous or non-existent local times that
            occur at a transition.
          </p>

          <h2>The sunrise</h2>
          <p>
            Panchang uses the Hindu convention: the centre of the sun&rsquo;s disc
            at the horizon, with no correction for atmospheric refraction. The
            Western convention takes the upper limb and applies refraction, which
            puts sunrise two to four minutes earlier. Two minutes sounds like
            nothing until it moves sunrise across a tithi boundary, and then the
            day is named for the wrong one.
          </p>

          <h2>The divisional charts</h2>
          <p>
            Each varga has its own rule for where the count begins, keyed to
            whether the sign is movable, fixed or dual, or simply to its parity.
            Trimsamsa alone divides each sign into five unequal parts. Getting
            these wrong is easy and invisible, which is why all sixteen are
            computed from their own rules rather than by dividing by a number.
          </p>

          <h2>What is not claimed</h2>
          <p>
            Accuracy of calculation is not accuracy of prediction. Everything on
            this page is about arithmetic: given a moment and a place, where the
            grahas were, and what the classical rules say follows from that. It
            says nothing about whether the rules themselves hold. A chart tells
            you what you are working with, not what will happen.
          </p>
        </div>

        <div className="mt-12" data-reveal>
          <Link
            href="/tools/kundli"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-gold-300)' }}
          >
            Cast a chart and check it yourself
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
