import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient, getUser } from '@/lib/supabase/server';
import { getSettings } from '@/lib/account/settings';
import { allowed } from '@/lib/features/flags';
import { SettingsForm } from '@/components/account/SettingsForm';
import { NotificationForm, type Prefs } from '@/components/account/NotificationForm';

export const metadata = { title: 'Settings', robots: { index: false } };
export const dynamic = 'force-dynamic';

const DEFAULT_PREFS: Prefs = {
  email_enabled: true,
  whatsapp_enabled: false,
  sms_enabled: false,
  phone: null,
  daily_reading: false,
  weekly_reading: true,
  monthly_reading: false,
  transit_alerts: true,
  newsletter: false,
  send_hour: 7,
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/dashboard/settings');

  const supabase = await createClient();

  const [settings, canUseSouthIndian, { data: prefRow }] = await Promise.all([
    getSettings(),
    allowed('south_indian_chart'),
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const prefs: Prefs = { ...DEFAULT_PREFS, ...(prefRow ?? {}) };

  return (
    // The group layout supplies the page padding, so this only narrows.
    <div className="max-w-2xl">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href="/dashboard" style={{ color: 'var(--color-gold-400)' }}>
          Dashboard
        </Link>
      </p>

      <h1 className="font-display mt-3 text-3xl" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        These apply to every chart you view here. Nothing is recomputed and
        stored, so changing a setting changes what you see immediately and
        changing it back loses nothing.
      </p>

      <div className="mt-10">
        <SettingsForm settings={settings} canUseSouthIndian={canUseSouthIndian} />
      </div>

      <div className="rule-gold my-12" />

      <h2 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Getting in touch
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Everything here is off unless you turn it on, and you can turn it back
        off from this page at any time without asking anybody.
      </p>

      <div className="mt-8">
        <NotificationForm prefs={prefs} />
      </div>
    </div>
  );
}
