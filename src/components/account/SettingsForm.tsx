'use client';

import { useActionState } from 'react';

import { saveSettings, type AccountState } from '@/lib/account/actions';
import type { UserSettings } from '@/lib/supabase/types';

const empty: AccountState = {};

type Settings = Pick<
  UserSettings,
  'chart_style' | 'ayanamsa' | 'house_system' | 'node_type' | 'language' | 'theme' | 'timezone'
>;

const AYANAMSAS = [
  { value: 'lahiri', label: 'Lahiri (Chitrapaksha)', note: 'The Indian government standard, and what most Indian astrologers use' },
  { value: 'raman', label: 'Raman', note: 'About 1.1° from Lahiri' },
  { value: 'krishnamurti', label: 'Krishnamurti (KP)', note: 'Used in KP astrology' },
  { value: 'yukteshwar', label: 'Yukteshwar', note: 'From The Holy Science' },
  { value: 'fagan_bradley', label: 'Fagan Bradley', note: 'Western sidereal' },
];

const HOUSE_SYSTEMS = [
  { value: 'whole_sign', label: 'Whole sign', note: 'Classical Jyotish. One sign, one house' },
  { value: 'placidus', label: 'Placidus', note: 'Unequal houses, common in Western work' },
  { value: 'koch', label: 'Koch', note: 'Unequal houses' },
  { value: 'equal', label: 'Equal', note: 'Thirty degrees from the ascendant degree' },
];

/**
 * Account settings.
 *
 * Each choice carries a one-line note explaining what it changes, because a
 * dropdown of ayanamsa names is meaningless to most people and a setting
 * nobody understands is a setting nobody should be shown.
 */
export function SettingsForm({
  settings,
  canUseSouthIndian,
}: {
  settings: Settings;
  canUseSouthIndian: boolean;
}) {
  const [state, action, pending] = useActionState(saveSettings, empty);

  return (
    <form action={action} className="space-y-8">
      <Section
        title="Chart style"
        blurb="Two regional conventions for drawing the same chart. Neither is more correct than the other; use whichever you grew up reading."
      >
        <Choice
          name="chart_style"
          value="north"
          defaultChecked={settings.chart_style === 'north'}
          label="North Indian"
          note="Diamond. The houses stay put and the signs move"
        />
        <Choice
          name="chart_style"
          value="south"
          defaultChecked={settings.chart_style === 'south'}
          label="South Indian"
          note={
            canUseSouthIndian
              ? 'Square. The signs stay put and the ascendant is marked'
              : 'Not available on your account yet'
          }
          disabled={!canUseSouthIndian}
        />
      </Section>

      <Section
        title="Calculation"
        blurb="Changing these changes every chart you view. If you do not know which to pick, the defaults are the classical ones and are what a reading from me uses."
      >
        <Select name="ayanamsa" label="Ayanamsa" defaultValue={settings.ayanamsa} options={AYANAMSAS} />
        <Select
          name="house_system"
          label="House system"
          defaultValue={settings.house_system}
          options={HOUSE_SYSTEMS}
        />
        <Select
          name="node_type"
          label="Rahu and Ketu"
          defaultValue={settings.node_type}
          options={[
            { value: 'mean', label: 'Mean node', note: 'The classical convention, a smooth average' },
            { value: 'true', label: 'True node', note: 'The oscillating position. Differs by up to about 1.5°' },
          ]}
        />
      </Section>

      <Section title="Display" blurb="How the site itself looks and reads.">
        <Select
          name="language"
          label="Language"
          defaultValue={settings.language}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'हिन्दी', note: 'Hindi' },
            { value: 'bn', label: 'বাংলা', note: 'Bengali' },
          ]}
        />
        <Select
          name="theme"
          label="Theme"
          defaultValue={settings.theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'Match my device' },
          ]}
        />
        <Field label="Your timezone" htmlFor="settings-tz" hint="Used for when things are sent to you">
          <input
            id="settings-tz"
            name="timezone"
            defaultValue={settings.timezone ?? ''}
            placeholder="Asia/Kolkata"
            className={input}
          />
        </Field>
      </Section>

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
          {pending ? 'Saving…' : 'Save settings'}
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

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {blurb}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Choice({
  name,
  value,
  label,
  note,
  defaultChecked,
  disabled,
}: {
  name: string;
  value: string;
  label: string;
  note: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className="surface-card flex cursor-pointer items-start gap-3 p-4"
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5"
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

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string; note?: string }[];
}) {
  const active = options.find((o) => o.value === defaultValue);

  return (
    <Field label={label} htmlFor={`settings-${name}`} hint={active?.note}>
      <select
        id={`settings-${name}`}
        name={name}
        defaultValue={defaultValue}
        className={input}
        style={{ colorScheme: 'dark' }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

const input =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)]';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
