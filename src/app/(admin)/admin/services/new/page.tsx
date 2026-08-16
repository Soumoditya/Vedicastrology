import { createClient } from '@/lib/supabase/server';
import { ServiceEditor } from '@/components/admin/ServiceEditor';
import type { Region } from '@/lib/supabase/types';

export const metadata = { title: 'New service', robots: { index: false } };

export default async function NewService() {
  const supabase = await createClient();
  const { data } = await supabase.from('regions').select('*').order('sort_order');

  return (
    <div>
      <h1 className="font-display mb-1.5 text-2xl" style={{ color: 'var(--text-primary)' }}>
        New service
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Save it first, then set the price for each region.
      </p>

      <ServiceEditor service={null} regions={(data as Region[] | null) ?? []} prices={[]} />
    </div>
  );
}
