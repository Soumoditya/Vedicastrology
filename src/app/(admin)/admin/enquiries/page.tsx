import { createClient } from '@/lib/supabase/server';
import { setEnquiryStatus } from '@/lib/enquiries/actions';
import type { Enquiry, EnquiryStatus, Service } from '@/lib/supabase/types';

export const metadata = { title: 'Enquiries', robots: { index: false } };
export const dynamic = 'force-dynamic';

const STATUSES: EnquiryStatus[] = [
  'new',
  'contacted',
  'scheduled',
  'completed',
  'closed',
];

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Replied',
  scheduled: 'Booked',
  completed: 'Done',
  closed: 'Closed',
};

type Row = Enquiry & { service: Pick<Service, 'title'> | null };

export default async function AdminEnquiries() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('enquiries')
    .select('*, service:services(title)')
    .order('created_at', { ascending: false })
    .limit(100);

  const enquiries = (data as unknown as Row[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Enquiries
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Everyone who has written to you, newest first.
      </p>

      {enquiries.length === 0 ? (
        <p className="surface-card mt-7 p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          No enquiries yet.
        </p>
      ) : (
        <ul className="mt-7 space-y-3">
          {enquiries.map((enquiry) => {
            const birth = enquiry.birth_details as
              | { date?: string; time?: string; place?: string }
              | null;

            return (
              <li key={enquiry.id} className="surface-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p style={{ color: 'var(--text-primary)' }}>
                      {enquiry.name}
                      {enquiry.service && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--color-gold-400)' }}>
                          {enquiry.service.title}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {/* mailto and tel so a reply is one tap on a phone. */}
                      <a href={`mailto:${enquiry.email}`} className="underline underline-offset-2">
                        {enquiry.email}
                      </a>
                      {enquiry.phone && (
                        <>
                          {' · '}
                          <a href={`tel:${enquiry.phone}`} className="underline underline-offset-2">
                            {enquiry.phone}
                          </a>
                        </>
                      )}
                      {' · '}
                      {new Date(enquiry.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider"
                    style={{
                      background:
                        enquiry.status === 'new'
                          ? 'color-mix(in oklab, var(--color-saffron-400) 16%, transparent)'
                          : 'color-mix(in oklab, var(--text-muted) 14%, transparent)',
                      color:
                        enquiry.status === 'new'
                          ? 'var(--color-saffron-300)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {STATUS_LABEL[enquiry.status]}
                  </span>
                </div>

                {enquiry.message && (
                  <p
                    className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {enquiry.message}
                  </p>
                )}

                {birth && (birth.date || birth.time || birth.place) && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--color-gold-400)' }}>
                    Birth: {[birth.date, birth.time, birth.place].filter(Boolean).join(', ')}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {STATUSES.map((status) => (
                    <form key={status} action={setEnquiryStatus}>
                      <input type="hidden" name="id" value={enquiry.id} />
                      <input type="hidden" name="status" value={status} />
                      <button
                        type="submit"
                        disabled={status === enquiry.status}
                        className="rounded-full border px-2.5 py-1 text-[0.7rem] disabled:opacity-40"
                        style={{
                          borderColor:
                            status === enquiry.status
                              ? 'var(--border-strong)'
                              : 'var(--border-subtle)',
                          color:
                            status === enquiry.status
                              ? 'var(--color-gold-300)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
