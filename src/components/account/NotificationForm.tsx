'use client';

import { useActionState, useState } from 'react';

import { saveNotificationPreferences, type AccountState } from '@/lib/account/actions';
import type { NotificationPreferences } from '@/lib/supabase/types';

const empty: AccountState = {};

export type Prefs = Omit<
  NotificationPreferences,
  'user_id' | 'created_at' | 'updated_at' | 'whatsapp_opt_in_at' | 'sms_opt_in_at'
>;

/**
 * Notification preferences.
 *
 * The channels and the things to be told about are kept apart, because they
 * are two questions: where should this reach you, and what is worth reaching
 * you about. Collapsing them into one list of nine toggles is how these pages
 * become unusable.
 */
export function NotificationForm({ prefs }: { prefs: Prefs }) {
  const [state, action, pending] = useActionState(saveNotificationPreferences, empty);
  const [whatsapp, setWhatsapp] = useState(prefs.whatsapp_enabled);
  const [sms, setSms] = useState(prefs.sms_enabled);

  const needsPhone = whatsapp || sms;

  return (
    <form action={action} className="space-y-8">
      <section>
        <h2 className="eyebrow">Where</h2>
        <div className="mt-4 space-y-2">
          <Toggle
            name="email_enabled"
            label="Email"
            note="Working now"
            defaultChecked={prefs.email_enabled}
          />
          <Toggle
            name="whatsapp_enabled"
            label="WhatsApp"
            note="Not connected yet. Turning this on records that you want it"
            checked={whatsapp}
            onChange={setWhatsapp}
          />
          <Toggle
            name="sms_enabled"
            label="SMS"
            note="Not connected yet"
            checked={sms}
            onChange={setSms}
          />
        </div>

        <div className="mt-4" style={{ opacity: needsPhone ? 1 : 0.5 }}>
          <label
            htmlFor="notif-phone"
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Phone number
          </label>
          <input
            id="notif-phone"
            name="phone"
            type="tel"
            defaultValue={prefs.phone ?? ''}
            placeholder="+91 98765 43210"
            className="mt-1.5 w-full max-w-sm rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Only used for messages you asked for. It is never shown to anyone
            and never sold.
          </p>
        </div>
      </section>

      <section>
        <h2 className="eyebrow">What</h2>
        <div className="mt-4 space-y-2">
          <Toggle
            name="daily_reading"
            label="Daily reading"
            note="Short, every morning"
            defaultChecked={prefs.daily_reading}
          />
          <Toggle
            name="weekly_reading"
            label="Weekly reading"
            note="The week ahead"
            defaultChecked={prefs.weekly_reading}
          />
          <Toggle
            name="monthly_reading"
            label="Monthly reading"
            note="Longer, once a month"
            defaultChecked={prefs.monthly_reading}
          />
          <Toggle
            name="transit_alerts"
            label="Transit alerts"
            note="When something genuinely notable touches your chart, not daily noise"
            defaultChecked={prefs.transit_alerts}
          />
          <Toggle
            name="newsletter"
            label="Journal posts"
            note="When something new is written"
            defaultChecked={prefs.newsletter}
          />
        </div>
      </section>

      <section>
        <h2 className="eyebrow">When</h2>
        <label
          htmlFor="notif-hour"
          className="mt-3 block text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Aim for around this hour, in your own timezone.
        </label>
        <select
          id="notif-hour"
          name="send_hour"
          defaultValue={String(prefs.send_hour)}
          className="mt-2 rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm"
          style={{ color: 'var(--text-primary)', colorScheme: 'dark' }}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-70"
          style={{
            background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
            color: '#150e00',
          }}
        >
          {pending ? 'Saving…' : 'Save preferences'}
        </button>

        {state.message && (
          <span className="text-sm" style={{ color: 'var(--color-benefic)' }} role="status">
            {state.message}
          </span>
        )}
        {state.error && (
          <span className="text-sm" style={{ color: 'var(--color-malefic)' }} role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  note,
  defaultChecked,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  note: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const controlled = checked !== undefined;

  return (
    <label className="surface-card flex cursor-pointer items-start gap-3 p-3.5">
      <input
        type="checkbox"
        name={name}
        className="mt-0.5"
        {...(controlled
          ? { checked, onChange: (e) => onChange?.(e.target.checked) }
          : { defaultChecked })}
      />
      <span>
        <span className="block text-sm" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
          {note}
        </span>
      </span>
    </label>
  );
}
