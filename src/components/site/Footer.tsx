import Link from 'next/link';

import { SITE, TOOL_LINKS } from '@/lib/site';
import { Wordmark } from './Wordmark';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-24 border-t"
      style={{ background: 'var(--surface-sunken)' }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Wordmark />
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {SITE.tagline} Charts computed with the Swiss Ephemeris, using the
              Lahiri ayanamsa.
            </p>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm transition-colors duration-200"
              style={{ color: 'var(--color-gold-400)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
              @{SITE.instagram}
            </a>
          </div>

          <FooterColumn title="Free tools">
            {TOOL_LINKS.map((t) => (
              <FooterLink key={t.href} href={t.href}>
                {t.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Readings">
            <FooterLink href="/services">All consultations</FooterLink>
            <FooterLink href="/testimonials">Testimonials</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/faq">Questions</FooterLink>
          </FooterColumn>

          <FooterColumn title="More">
            <FooterLink href="/blog">Journal</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/legal/privacy">Privacy</FooterLink>
            <FooterLink href="/legal/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div className="rule-gold mt-12" />

        <div
          className="mt-6 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"
          style={{ color: 'var(--text-muted)' }}
        >
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p>
            Readings are offered for guidance and reflection, and are not a
            substitute for medical, legal or financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="mb-3.5 text-[0.68rem] font-medium uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-gold-600)' }}
      >
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm transition-colors duration-200 hover:text-[var(--color-gold-300)]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </Link>
    </li>
  );
}
