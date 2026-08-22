import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms on which this site and its readings are offered.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
      <p className="eyebrow">Terms</p>
      <h1
        className="font-display mt-5 text-[clamp(2rem,5vw,3rem)] leading-[1.05]"
        style={{ color: 'var(--text-primary)' }}
      >
        Terms of use
      </h1>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Last updated 29 July 2026
      </p>

      <div className="prose-vedic mt-10">
        <h2>What this site offers</h2>
        <p>
          Calculation tools that are free to use, and personal astrology
          readings that are paid for. The tools are provided as they are, and
          while considerable care has gone into their accuracy, no calculation
          is warranted to be free of error.
        </p>

        <h2>What a reading is</h2>
        <p>
          A reading is one person&apos;s interpretation of a chart, offered for
          reflection and perspective. It is not a prediction of fact and it is
          not professional advice.
        </p>
        <p>
          <strong>
            Nothing here is a substitute for medical, legal, financial or
            psychological advice.
          </strong>{' '}
          If something in your life needs a doctor, a lawyer or a therapist,
          please see one. A reading will not tell you to avoid treatment, and
          any astrologer who does is one to walk away from.
        </p>

        <h2>Decisions remain yours</h2>
        <p>
          What you do after a reading is your own decision and your own
          responsibility. No liability is accepted for choices made on the
          strength of an interpretation.
        </p>

        <h2>Accuracy of what you provide</h2>
        <p>
          A chart is only as good as the birth details behind it. A wrong time
          moves the ascendant and with it most of the chart, and there is no way
          to detect that from the details alone.
        </p>

        <h2>Your account</h2>
        <p>
          Keep your password to yourself. Accounts that are used to abuse the
          site or other people may be closed.
        </p>

        <h2>Content</h2>
        <p>
          Writing, design and code on this site belong to their author. The
          calculation engine uses the Swiss Ephemeris under the AGPL, which is
          why the source code is public.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may change. The date above shows when they last did.
        </p>
      </div>
    </div>
  );
}
