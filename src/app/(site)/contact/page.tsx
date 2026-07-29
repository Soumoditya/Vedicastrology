import type { Metadata } from 'next';

import { SITE } from '@/lib/site';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Ask a question, or enquire about a reading.',
};

export default function ContactPage() {
  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div data-reveal="left">
            <p className="eyebrow">Contact</p>
            <h1
              className="font-display mt-5 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]"
              style={{ color: 'var(--text-primary)' }}
            >
              Write to me.
            </h1>
            <p
              className="mt-6 max-w-md text-[1.0625rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Every message is read and answered personally, usually within a
              day or two. Questions get answered whether or not they lead to a
              booking.
            </p>
            <p
              className="mt-4 max-w-md text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              If astrology is not the right thing for what you are dealing with,
              I will say so rather than sell you a reading.
            </p>

            <div className="rule-gold my-8 max-w-xs" />

            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-gold-400)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
              @{SITE.instagram}
            </a>
          </div>

          <div className="surface-card p-7 sm:p-8" data-reveal="scale">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
