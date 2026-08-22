import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatPrice, getServiceBySlug } from '@/lib/pricing/region';
import { SITE } from '@/lib/site';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Reveal } from '@/components/motion/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) return { title: 'Not found' };

  return {
    title: service.seo_title ?? service.title,
    description: service.seo_description ?? service.summary ?? undefined,
    openGraph: {
      title: service.title,
      description: service.summary ?? undefined,
      type: 'website',
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  const price = service.price;

  // Structured data, so search engines can show the offer properly.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary ?? undefined,
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price: Number(price.amount),
            priceCurrency: price.region.currency,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative mx-auto max-w-5xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <Link
          href="/services"
          className="text-xs transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          ← All consultations
        </Link>

        <div className="mt-8 grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <h1
              className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.03]"
              style={{ color: 'var(--text-primary)' }}
              data-reveal
            >
              {service.title}
            </h1>

            {service.summary && (
              <p
                className="mt-6 text-[1.0625rem] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
                data-reveal
              >
                {service.summary}
              </p>
            )}

            {service.description && (
              <div
                className="prose-vedic mt-10"
                data-reveal
              >
                {/* Stored as plain text from the admin textarea, so paragraphs
                    are split on blank lines rather than rendered as HTML.
                    Nothing from the database is injected as markup. */}
                {service.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {service.deliverables.length > 0 && (
              <div className="mt-12" data-reveal>
                <p className="eyebrow">What you receive</p>
                <ul className="mt-5 space-y-3">
                  {service.deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[0.9375rem]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span
                        aria-hidden
                        className="mt-2 text-[0.5rem]"
                        style={{ color: 'var(--color-gold-500)' }}
                      >
                        ◆
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="surface-card p-6 sm:p-7" data-reveal="scale">
              {price ? (
                <div className="mb-6">
                  {price.compare_at && (
                    <p className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatPrice(Number(price.compare_at), price.region.currency)}
                    </p>
                  )}
                  <p
                    className="font-display text-4xl"
                    style={{ color: 'var(--color-gold-300)' }}
                  >
                    {formatPrice(Number(price.amount), price.region.currency)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {service.duration_minutes
                      ? `${service.duration_minutes} minute session`
                      : 'Per reading'}
                    {' · '}
                    {price.region.currency}
                  </p>
                </div>
              ) : (
                <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Price on enquiry.
                </p>
              )}

              <div className="rule-gold mb-6" />

              <EnquiryForm serviceId={service.id} serviceTitle={service.title} />
            </div>

            <p
              className="mt-4 text-center text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Payment is arranged after we have spoken, so nothing is taken
              before you know the reading is right for you.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
