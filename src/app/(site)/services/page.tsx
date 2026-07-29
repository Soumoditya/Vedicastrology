import type { Metadata } from 'next';
import Link from 'next/link';

import { formatPrice, getServicesWithPrices, resolveRegion } from '@/lib/pricing/region';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Consultations',
  description:
    'Personal Vedic astrology readings. Your whole chart read properly, ' +
    'rather than a paragraph generated from your sun sign.',
};

// Prices depend on the visitor's region, which is per request.
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const [services, region] = await Promise.all([
    getServicesWithPrices(),
    resolveRegion(),
  ]);

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow" data-reveal>
            Consultations
          </p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            Your whole chart,
            <span className="text-gold-leaf block">read properly.</span>
          </h1>
          <p
            className="mt-7 text-[1.0625rem] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            The free tools give you the chart. A reading is where someone sits
            with it, weighs what is strong against what is not, and tells you
            what it actually means for the thing you are dealing with.
          </p>
        </header>

        {services.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-16 space-y-4">
            {services.map((service, i) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="surface-card group grid gap-6 p-7 transition-colors duration-500 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
                data-reveal
                style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
              >
                <div className="min-w-0">
                  <h2
                    className="font-display text-2xl transition-colors duration-300 group-hover:text-[var(--color-gold-200)]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {service.title}
                  </h2>

                  {service.summary && (
                    <p
                      className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {service.summary}
                    </p>
                  )}

                  {service.duration_minutes && (
                    <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {service.duration_minutes} minutes
                    </p>
                  )}
                </div>

                <div className="shrink-0 sm:text-right">
                  {service.price ? (
                    <>
                      {service.price.compare_at && (
                        <p
                          className="text-sm line-through"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {formatPrice(
                            Number(service.price.compare_at),
                            service.price.region.currency,
                          )}
                        </p>
                      )}
                      <p
                        className="font-display text-3xl"
                        style={{ color: 'var(--color-gold-300)' }}
                      >
                        {formatPrice(
                          Number(service.price.amount),
                          service.price.region.currency,
                        )}
                      </p>
                      {/* Say so when the price shown is not the visitor's own
                          region, rather than quietly displaying another
                          market's figure as if it were theirs. */}
                      {region && service.price.region_id !== region.id && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          in {service.price.region.currency}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Price on enquiry
                    </p>
                  )}

                  <span
                    aria-hidden
                    className="mt-2 inline-block text-lg transition-transform duration-500 group-hover:translate-x-1.5"
                    style={{ color: 'var(--color-gold-400)' }}
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Enquiry is always available, even with no services listed. Someone
            who wants a reading should never hit a dead end. */}
        <section className="mt-24 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div data-reveal="left">
            <p className="eyebrow">Get in touch</p>
            <h2
              className="font-display mt-5 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.08]"
              style={{ color: 'var(--text-primary)' }}
            >
              Not sure which you need?
            </h2>
            <p
              className="mt-5 max-w-md text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tell me what is going on and I will say honestly whether astrology
              is the right thing for it, and which reading would actually help.
              If it is not, I will tell you that too.
            </p>
          </div>

          <div className="surface-card p-7 sm:p-8" data-reveal="scale">
            <EnquiryForm />
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Shown before any service is published. It has to be honest that nothing is
 * listed yet, without looking broken, and still let someone make contact.
 */
function EmptyState() {
  return (
    <div className="surface-card mt-16 p-8 text-center" data-reveal>
      <p className="font-display text-xl" style={{ color: 'var(--color-gold-200)' }}>
        Readings are being finalised
      </p>
      <p
        className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        The consultation list is not published yet. In the meantime the message
        form below reaches me directly, and every free tool on the site is fully
        working.
      </p>
    </div>
  );
}
