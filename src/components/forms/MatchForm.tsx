'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PlaceResult } from '@/lib/geo/geocode';
import { PlaceAutocomplete } from './PlaceAutocomplete';

interface Person {
  name: string;
  date: string;
  time: string;
  place: PlaceResult | null;
}

const blank: Person = { name: '', date: '', time: '', place: null };

/**
 * Two sets of birth details for Guna Milan.
 *
 * Time is optional here and labelled as such, because the score depends only
 * on each Moon's nakshatra and rashi. Demanding a birth time for a matching
 * tool turns most people away for no gain: a date and place is enough, and a
 * known time only sharpens the Mangal dosha check.
 */
export function MatchForm() {
  const router = useRouter();
  const [a, setA] = useState<Person>(blank);
  const [b, setB] = useState<Person>(blank);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!a.date || !a.place) return setError('Please complete the first person’s details.');
    if (!b.date || !b.place) return setError('Please complete the second person’s details.');

    const params = new URLSearchParams();
    for (const [prefix, person] of [['a', a], ['b', b]] as const) {
      params.set(`${prefix}d`, person.date);
      params.set(`${prefix}t`, person.time || '12:00');
      params.set(`${prefix}lat`, person.place!.latitude.toFixed(4));
      params.set(`${prefix}lon`, person.place!.longitude.toFixed(4));
      params.set(`${prefix}tz`, person.place!.timezone);
      params.set(`${prefix}place`, person.place!.label);
      if (person.name) params.set(`${prefix}name`, person.name);
    }

    router.push(`/tools/matching?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <PersonFields legend="First person" person={a} onChange={setA} idPrefix="a" />

      <div className="rule-gold" />

      <PersonFields legend="Second person" person={b} onChange={setB} idPrefix="b" />

      {error && (
        <p
          role="alert"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'color-mix(in oklab, var(--color-malefic) 40%, transparent)',
            background: 'color-mix(in oklab, var(--color-malefic) 8%, transparent)',
            color: 'var(--color-malefic)',
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full px-6 py-3.5 text-sm font-medium"
        style={{
          background:
            'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500) 55%, var(--color-gold-400))',
          color: '#150e00',
        }}
      >
        Compare the charts
      </button>
    </form>
  );
}

function PersonFields({
  legend,
  person,
  onChange,
  idPrefix,
}: {
  legend: string;
  person: Person;
  onChange: (p: Person) => void;
  idPrefix: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="eyebrow mb-2">{legend}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`${idPrefix}-name`} hint="Optional">
          <input
            id={`${idPrefix}-name`}
            value={person.name}
            onChange={(e) => onChange({ ...person, name: e.target.value })}
            className={input}
            autoComplete="off"
          />
        </Field>

        <Field label="Date of birth" htmlFor={`${idPrefix}-date`}>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={person.date}
            onChange={(e) => onChange({ ...person, date: e.target.value })}
            min="1800-01-01"
            max="2400-12-31"
            className={input}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Time of birth" htmlFor={`${idPrefix}-time`} hint="Not required">
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={person.time}
            onChange={(e) => onChange({ ...person, time: e.target.value })}
            className={input}
          />
        </Field>

        <PlaceAutocomplete
          id={`${idPrefix}-place`}
          label="Place of birth"
          value={person.place}
          onChange={(place) => onChange({ ...person, place })}
        />
      </div>
    </fieldset>
  );
}

const input =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)] [color-scheme:dark]';

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
      {children}
    </div>
  );
}
