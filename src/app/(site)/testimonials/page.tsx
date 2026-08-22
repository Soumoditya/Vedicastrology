import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/site';
import { TestimonialForm } from '@/components/forms/TestimonialForm';
import { Reveal } from '@/components/motion/Reveal';
import type { Testimonial } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Testimonials',
  description: 'What people have said after a reading.',
};

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage() {
  const supabase = await createClient();

  // The row policy already limits this to approved rows, so no filter is
  // needed here and none could be forgotten.
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  const testimonials = (data as Testimonial[] | null) ?? [];

  const average =
    testimonials.length > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
      : 0;

  const jsonLd =
    testimonials.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE.name,
          url: SITE.url,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: average.toFixed(1),
            reviewCount: testimonials.length,
            bestRating: 5,
          },
        }
      : null;

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="relative mx-auto max-w-4xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <header className="max-w-xl">
          <p className="eyebrow" data-reveal>In their words</p>
          <h1
            className="font-display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.04]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            What people say
            <span className="text-gold-leaf block">afterwards.</span>
          </h1>
          {testimonials.length > 0 && (
            <p className="mt-5 text-sm" style={{ color: 'var(--text-secondary)' }} data-reveal>
              {average.toFixed(1)} out of 5, from {testimonials.length}{' '}
              {testimonials.length === 1 ? 'person' : 'people'}. Every one is
              read before it appears, and nothing is edited.
            </p>
          )}
        </header>

        {testimonials.length === 0 ? (
          <div className="surface-card mt-12 p-7" data-reveal>
            <p className="font-display text-xl" style={{ color: 'var(--color-gold-200)' }}>
              Nothing here yet
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              No testimonials have been published so far. Rather than fill this
              page with invented quotes, it stays empty until real people have
              written something. If you have had a reading, the form below is
              open.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <figure
                key={t.id}
                className="surface-card p-6"
                data-reveal
                style={{ '--reveal-delay': `${i * 50}ms` } as React.CSSProperties}
              >
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, s) => (
                    <span
                      key={s}
                      aria-hidden
                      style={{
                        color: s < t.rating ? 'var(--color-gold-400)' : 'var(--border-subtle)',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <blockquote
                  className="font-quote mt-4 text-lg italic leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t.body}
                </blockquote>
                <figcaption className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t.author_name}
                  {t.author_location && `, ${t.author_location}`}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div data-reveal="left">
            <p className="eyebrow">Had a reading?</p>
            <h2
              className="font-display mt-5 text-2xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Say what it was actually like
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Honest is more useful than glowing. If something did not land, say
              so. Nothing is edited, and a page of uniformly perfect reviews
              convinces nobody.
            </p>
          </div>

          <div className="surface-card p-6 sm:p-7" data-reveal="scale">
            <TestimonialForm />
          </div>
        </section>
      </div>
    </div>
  );
}
