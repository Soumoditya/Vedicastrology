import { createClient } from '@/lib/supabase/server';
import { moderateTestimonial } from '@/lib/testimonials/actions';
import type { Testimonial } from '@/lib/supabase/types';

export const metadata = { title: 'Testimonials', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminTestimonials() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  const all = (data as Testimonial[] | null) ?? [];
  const pending = all.filter((t) => t.status === 'pending');
  const rest = all.filter((t) => t.status !== 'pending');

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Testimonials
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Nothing appears on the site until you approve it.
      </p>

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow">Waiting for you ({pending.length})</h2>
          <ul className="mt-4 space-y-3">
            {pending.map((t) => (
              <Row key={t.id} testimonial={t} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="eyebrow">Reviewed</h2>
        {rest.length === 0 ? (
          <p className="surface-card mt-4 p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Nothing reviewed yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rest.map((t) => (
              <Row key={t.id} testimonial={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <li className="surface-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span style={{ color: 'var(--text-primary)' }}>{t.author_name}</span>
          {t.author_location && (
            <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {t.author_location}
            </span>
          )}
          <span className="ml-2" style={{ color: 'var(--color-gold-400)' }}>
            {'★'.repeat(t.rating)}
          </span>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider"
          style={{
            background:
              t.status === 'approved'
                ? 'color-mix(in oklab, var(--color-benefic) 16%, transparent)'
                : t.status === 'rejected'
                  ? 'color-mix(in oklab, var(--color-malefic) 16%, transparent)'
                  : 'color-mix(in oklab, var(--color-saffron-400) 16%, transparent)',
            color:
              t.status === 'approved'
                ? 'var(--color-benefic)'
                : t.status === 'rejected'
                  ? 'var(--color-malefic)'
                  : 'var(--color-saffron-300)',
          }}
        >
          {t.status}
          {t.is_featured && ' · featured'}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {t.body}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['approved', 'rejected', 'pending'] as const).map((status) => (
          <form key={status} action={moderateTestimonial}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              disabled={status === t.status}
              className="rounded-full border px-3 py-1 text-xs disabled:opacity-40"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              {status === 'approved' ? 'Publish' : status === 'rejected' ? 'Reject' : 'Unpublish'}
            </button>
          </form>
        ))}

        {t.status === 'approved' && (
          <form action={moderateTestimonial}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="status" value="approved" />
            <input type="hidden" name="feature" value={t.is_featured ? 'off' : 'on'} />
            <button
              type="submit"
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-300)' }}
            >
              {t.is_featured ? 'Unfeature' : 'Feature'}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
