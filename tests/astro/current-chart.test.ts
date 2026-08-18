import { describe, expect, it, vi } from 'vitest';

/*
  `current-chart` pulls in Supabase and next/navigation, neither of which is
  wanted here: the parts worth asserting are the two pure ones that decide what
  every link on the site points at.
*/
vi.mock('@/lib/supabase/server', () => ({
  getUser: async () => null,
  createClient: async () => {
    throw new Error('not used in these tests');
  },
}));
vi.mock('next/navigation', () => ({
  redirect: () => {
    throw new Error('redirect should not be reached in these tests');
  },
}));

import { chartQueryString, withChart } from '@/lib/astro/current-chart';
import type { BirthProfile } from '@/lib/supabase/types';

const profile = (over: Partial<BirthProfile> = {}): BirthProfile => ({
  id: 'p1',
  user_id: 'u1',
  label: 'Soumoditya',
  person_name: null,
  birth_date: '2004-10-12',
  birth_time: '13:22:00',
  time_unknown: false,
  timezone: 'Asia/Kolkata',
  place_name: 'Rampur Hat, West Bengal, India',
  latitude: 24.1774,
  longitude: 87.7827,
  gender: null,
  notes: null,
  is_default: true,
  created_at: '2026-08-16T00:00:00Z',
  updated_at: '2026-08-16T00:00:00Z',
  ...over,
});

describe('chartQueryString', () => {
  it('carries everything a tool needs to recast the chart', () => {
    const q = new URLSearchParams(chartQueryString(profile()));
    expect(q.get('d')).toBe('2004-10-12');
    expect(q.get('t')).toBe('13:22');
    expect(q.get('lat')).toBe('24.1774');
    expect(q.get('lon')).toBe('87.7827');
    expect(q.get('tz')).toBe('Asia/Kolkata');
    expect(q.get('place')).toBe('Rampur Hat, West Bengal, India');
    expect(q.get('name')).toBe('Soumoditya');
  });

  it('falls back to noon and keeps the unknown flag, so nothing reads as certain', () => {
    const q = new URLSearchParams(
      chartQueryString(profile({ birth_time: null, time_unknown: true })),
    );
    expect(q.get('t')).toBe('12:00');
    expect(q.get('unknown')).toBe('1');
  });

  it('prefers the person name over the label', () => {
    const q = new URLSearchParams(chartQueryString(profile({ person_name: 'Ananya' })));
    expect(q.get('name')).toBe('Ananya');
  });

  it('carries gender when it is known, and omits it when it is not', () => {
    expect(new URLSearchParams(chartQueryString(profile({ gender: 'female' }))).get('g'))
      .toBe('female');
    expect(new URLSearchParams(chartQueryString(profile())).get('g')).toBeNull();
  });
});

describe('withChart', () => {
  it('stamps the chart onto a bare tool link', () => {
    expect(withChart('/tools/kundli', profile())).toContain('/tools/kundli?d=2004-10-12');
  });

  it('leaves a link that already carries a query alone', () => {
    expect(withChart('/tools/kundli?d=1990-01-01', profile())).toBe(
      '/tools/kundli?d=1990-01-01',
    );
  });

  it('is a no-op with no saved chart, so signed-out visitors still get the form', () => {
    expect(withChart('/tools/kundli', null)).toBe('/tools/kundli');
  });
});
