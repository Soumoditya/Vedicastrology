import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Questions',
  description:
    'Common questions about the charts, birth times, accuracy, readings and ' +
    'what astrology can and cannot tell you.',
};

const FAQS = [
  {
    q: 'Do I need my exact birth time?',
    a: 'For the full chart, yes, it matters a great deal. The ascendant moves through a whole sign every two hours, and it decides which house every graha falls into. Without a time you can still rely on the signs and nakshatras, and every tool here marks clearly which parts of a chart you can trust when the time is unknown rather than presenting a guess as fact.',
  },
  {
    q: 'Why does your chart differ from another site?',
    a: 'Usually the ayanamsa or the time zone. This site uses Lahiri, the Indian standard, and applies the time zone offset that was actually in force on your birth date. India used +05:21:10 before 1906 and +06:30 during the war years, and sites that assume +05:30 get every older chart wrong in a way that still looks perfectly plausible.',
  },
  {
    q: 'Is the free chart the same one you use in a reading?',
    a: 'Yes, exactly the same calculations. Nothing is held back for paying clients. What a reading adds is judgement: weighing what is strong against what is not, and saying what it means for the thing you are actually dealing with.',
  },
  {
    q: 'What does the ℞ mark mean?',
    a: 'Retrograde, meaning the graha appears to move backwards against the stars from where we stand. Every chart on the site carries a key explaining that and the colour coding.',
  },
  {
    q: 'Is 36 out of 36 needed for marriage?',
    a: 'No, and treating Guna Milan as the whole answer is one of the most common mistakes made with it. It compares two Moons and nothing else. It says nothing about the seventh house in either chart, the state of Venus and Jupiter, the periods each person is running, or anything the two of you already know about each other.',
  },
  {
    q: 'Can astrology tell me what will happen?',
    a: 'It can describe conditions, timing and tendencies. It cannot tell you what you will decide. Anyone promising certainty about the future is selling something other than astrology.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. Every tool works without one. An account only means your charts are waiting for you when you come back.',
  },
  {
    q: 'What happens to my birth details?',
    a: 'Charts cast with the free tools are calculated and returned without being stored. If you save a chart to an account, only the birth details are kept and the chart is recalculated each time. Nothing goes into research unless you switch that on yourself, and it can be switched off again at any time. The privacy page sets all of this out in full.',
  },
] as const;

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="relative">
      <div className="starfield" aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative mx-auto max-w-2xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <p className="eyebrow">Questions</p>
        <h1
          className="font-display mt-5 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]"
          style={{ color: 'var(--text-primary)' }}
        >
          Things people ask
        </h1>

        <dl className="mt-12 space-y-8">
          {FAQS.map((item) => (
            <div key={item.q} className="border-t pt-6">
              <dt
                className="font-display text-xl leading-snug"
                style={{ color: 'var(--color-gold-200)' }}
              >
                {item.q}
              </dt>
              <dd
                className="mt-3 text-[0.9375rem] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="surface-card mt-14 p-6">
          <p className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Something not answered here?
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Ask directly. Questions get answered whether or not they lead to a
            booking.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
                color: '#150e00',
              }}
            >
              Get in touch
            </Link>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-5 py-2.5 text-sm"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
