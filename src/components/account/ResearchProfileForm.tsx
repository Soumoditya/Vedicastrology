'use client';

import { useActionState } from 'react';

import { saveLifeEvents, type AccountState } from '@/lib/account/actions';
import {
  EDUCATION_LEVEL,
  GENDER,
  MARITAL_STATUS,
  OCCUPATION_CATEGORY,
} from '@/lib/research/vocab';

const empty: AccountState = {};

export interface LifeEventValues {
  gender: string | null;
  marital_status: string | null;
  marriage_year: number | null;
  children_count: number | null;
  first_child_year: number | null;
  education_level: string | null;
  occupation_category: string | null;
  career_change_years: number[];
  relocation_years: number[];
  major_health_years: number[];
}

/**
 * Optional life details, for people who have opted into research.
 *
 * This is the part that makes the dataset able to test a classical claim
 * rather than only describe chart distributions. Every field is optional, and
 * the form says plainly what each one is for, because someone giving their
 * marriage year to a stranger deserves to know why it is being asked.
 */
export function ResearchProfileForm({
  values,
  healthConsent,
}: {
  values: LifeEventValues | null;
  healthConsent: boolean;
}) {
  const [state, action, pending] = useActionState(saveLifeEvents, empty);
  const v = values;

  return (
    <form action={action} className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select name="gender" label="Gender" defaultValue={v?.gender} options={GENDER} />
        <Select
          name="marital_status"
          label="Relationship status"
          defaultValue={v?.marital_status}
          options={MARITAL_STATUS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Number
          name="marriage_year"
          label="Year married"
          hint="If applicable"
          defaultValue={v?.marriage_year}
        />
        <Number
          name="children_count"
          label="Children"
          hint="How many"
          defaultValue={v?.children_count}
          max={30}
        />
        <Number
          name="first_child_year"
          label="First child born"
          hint="Year"
          defaultValue={v?.first_child_year}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="education_level"
          label="Education"
          defaultValue={v?.education_level}
          options={EDUCATION_LEVEL}
        />
        <Select
          name="occupation_category"
          label="Field of work"
          defaultValue={v?.occupation_category}
          options={OCCUPATION_CATEGORY}
        />
      </div>

      <Years
        name="career_change_years"
        label="Years your work changed significantly"
        hint="New job, new field, starting out on your own"
        defaultValue={v?.career_change_years}
      />

      <Years
        name="relocation_years"
        label="Years you moved home"
        hint="Especially to another city or country"
        defaultValue={v?.relocation_years}
      />

      {/*
        Health sits behind its own consent. Special category data under GDPR
        Article 9 and sensitive under the DPDP Act, so bundling it into the
        general research consent would make that consent invalid.
      */}
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-sunken)' }}
      >
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            name="health_consent"
            defaultChecked={healthConsent}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold-500)]"
          />
          <span className="text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              I also agree to share years of significant ill health
            </span>
            <span className="mt-1 block text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Asked separately because health information is treated as
              sensitive in law, and it would not be right to fold it into a
              general agreement. Only the years, never any detail of what
              happened. Untick this and the years are erased straight away.
            </span>
          </span>
        </label>

        <div className="mt-4">
          <Years
            name="major_health_years"
            label="Years of significant ill health"
            hint="Only if you ticked the box above"
            defaultValue={v?.major_health_years}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-malefic)' }}>
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm" style={{ color: 'var(--color-benefic)' }}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-70"
        style={{
          background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
          color: '#150e00',
        }}
      >
        {pending ? 'Saving…' : 'Save details'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------

const field =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)]';

function Label({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
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
  defaultValue: string | null | undefined;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <Label htmlFor={name} label={label} hint="Optional" />
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={field}
        style={{ colorScheme: 'dark' }}
      >
        <option value="">Not given</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Number({
  name,
  label,
  hint,
  defaultValue,
  max,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: number | null | undefined;
  max?: number;
}) {
  return (
    <div>
      <Label htmlFor={name} label={label} hint={hint} />
      <input
        id={name}
        name={name}
        type="number"
        min={max ? 0 : 1800}
        max={max ?? 2400}
        defaultValue={defaultValue ?? ''}
        className={field}
      />
    </div>
  );
}

function Years({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: number[] | undefined;
}) {
  return (
    <div>
      <Label htmlFor={name} label={label} hint={hint} />
      <input
        id={name}
        name={name}
        defaultValue={(defaultValue ?? []).join(', ')}
        placeholder="2011, 2018, 2022"
        className={field}
      />
    </div>
  );
}
