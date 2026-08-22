import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellations and refunds',
  description: 'How cancellations, rescheduling and refunds work.',
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
      <p className="eyebrow">Cancellations</p>
      <h1
        className="font-display mt-5 text-[clamp(2rem,5vw,3rem)] leading-[1.05]"
        style={{ color: 'var(--text-primary)' }}
      >
        Cancellations and refunds
      </h1>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Last updated 29 July 2026
      </p>

      <div className="prose-vedic mt-10">
        <h2>Before a reading</h2>
        <p>
          Cancel or move a booking with at least twenty four hours&apos; notice
          and you will be refunded in full, or rescheduled, whichever you
          prefer.
        </p>
        <p>
          With less than twenty four hours&apos; notice, the time has usually
          already been set aside, so a reschedule is offered rather than a
          refund. If something genuinely unavoidable happened, say so. This is
          not a rule to be hidden behind.
        </p>

        <h2>After a reading</h2>
        <p>
          A reading is time and attention spent on your chart, so it cannot be
          returned once it has happened. If you feel something went wrong, write
          and explain. It will be taken seriously and put right where it can be.
        </p>

        <h2>Written reports</h2>
        <p>
          A written report can be refunded any time before it is sent. Once
          delivered it cannot be, for the same reason.
        </p>

        <h2>If a session is cancelled from this side</h2>
        <p>
          You will be offered another time or a full refund, entirely as you
          prefer.
        </p>

        <h2>How refunds arrive</h2>
        <p>
          Back the way the payment came, usually within five to seven working
          days once processed.
        </p>
      </div>
    </div>
  );
}
