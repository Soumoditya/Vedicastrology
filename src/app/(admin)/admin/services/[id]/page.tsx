import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { deleteService } from '@/lib/admin/actions';
import { ServiceEditor } from '@/components/admin/ServiceEditor';
import type { Region, Service, ServicePrice } from '@/lib/supabase/types';

export const metadata = { title: 'Edit service', robots: { index: false } };

export default async function EditService({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();

  const [serviceResult, regionsResult, pricesResult] = await Promise.all([
    supabase.from('services').select('*').eq('id', id).maybeSingle(),
    supabase.from('regions').select('*').order('sort_order'),
    supabase.from('service_prices').select('*').eq('service_id', id),
  ]);

  const service = serviceResult.data as Service | null;
  if (!service) notFound();

  return (
    <div>
      <h1 className="font-display mb-1.5 text-2xl" style={{ color: 'var(--text-primary)' }}>
        {service.title}
      </h1>
      <a
        href={`/services/${service.slug}`}
        className="mb-6 inline-block text-xs underline underline-offset-4"
        style={{ color: 'var(--color-gold-400)' }}
      >
        View on the site
      </a>

      {saved && (
        <p
          role="status"
          className="mb-5 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'color-mix(in oklab, var(--color-benefic) 40%, transparent)',
            background: 'color-mix(in oklab, var(--color-benefic) 8%, transparent)',
            color: 'var(--color-benefic)',
          }}
        >
          Saved.
        </p>
      )}

      <ServiceEditor
        service={service}
        regions={(regionsResult.data as Region[] | null) ?? []}
        prices={(pricesResult.data as ServicePrice[] | null) ?? []}
      />

      <form action={deleteService} className="mt-10 border-t pt-6">
        <input type="hidden" name="id" value={service.id} />
        <button
          type="submit"
          className="text-xs underline underline-offset-4"
          style={{ color: 'var(--color-malefic)' }}
        >
          Delete this service permanently
        </button>
      </form>
    </div>
  );
}
