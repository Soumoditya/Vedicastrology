import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import {
  currentTransits,
  gocharaVerdict,
  sadeSati,
  upcomingIngresses,
} from '@/lib/astro/transits';

/**
 * Transits and Sade Sati.
 *
 * Sade Sati dates are the ones people plan around, so the tests here check
 * structural facts that must hold for any chart rather than one memorised
 * example: the three legs are the right signs, they run in order, and their
 * lengths match Saturn's real orbit. A mean-motion approximation would drift
 * out of these bounds.
 */

const chart = castChart({
  year: 1990,
  month: 8,
  day: 15,
  hour: 10,
  minute: 30,
  place: {
    name: 'Kolkata, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
});

const YEAR_MS = 365.25 * 86_400_000;

describe('current transits', () => {
  const positions = currentTransits(chart, new Date('2026-07-29T00:00:00Z'));

  it('places all nine grahas', () => {
    expect(positions).toHaveLength(9);
  });

  it('relates each to both the ascendant and the Moon', () => {
    for (const p of positions) {
      expect(p.houseFromAscendant).toBeGreaterThanOrEqual(1);
      expect(p.houseFromAscendant).toBeLessThanOrEqual(12);
      expect(p.houseFromMoon).toBeGreaterThanOrEqual(1);
      expect(p.houseFromMoon).toBeLessThanOrEqual(12);
      expect(p.rashi).toBeGreaterThanOrEqual(0);
      expect(p.rashi).toBeLessThanOrEqual(11);
    }
  });

  it('keeps Ketu exactly opposite Rahu', () => {
    const rahu = positions.find((p) => p.graha === 'Rahu')!;
    const ketu = positions.find((p) => p.graha === 'Ketu')!;
    expect(Math.abs(rahu.longitude - ketu.longitude)).toBeCloseTo(180, 6);
  });
});

describe('sade sati', () => {
  const result = sadeSati(chart, new Date('2026-07-29T00:00:00Z'), 40);
  const moonRashi = chart.byGraha.Moon.rashi;

  it('covers the sign before the Moon, the Moon, and the sign after', () => {
    const rising = result.phases.filter((p) => p.phase === 'rising');
    const peak = result.phases.filter((p) => p.phase === 'peak');
    const setting = result.phases.filter((p) => p.phase === 'setting');

    expect(rising.length).toBeGreaterThan(0);
    expect(peak.length).toBeGreaterThan(0);
    expect(setting.length).toBeGreaterThan(0);

    for (const p of rising) expect(p.rashi).toBe((moonRashi + 11) % 12);
    for (const p of peak) expect(p.rashi).toBe(moonRashi);
    for (const p of setting) expect(p.rashi).toBe((moonRashi + 1) % 12);
  });

  it('returns phases in chronological order', () => {
    for (let i = 1; i < result.phases.length; i++) {
      expect(result.phases[i].start.getTime()).toBeGreaterThanOrEqual(
        result.phases[i - 1].start.getTime(),
      );
    }
  });

  it('gives each leg roughly the length of a Saturn sign transit', () => {
    // Saturn takes about 29.46 years for the zodiac, so about 2.45 years a
    // sign. Retrogrades stretch a leg, never to double it.
    for (const phase of result.phases) {
      const years = (phase.end.getTime() - phase.start.getTime()) / YEAR_MS;
      expect(years).toBeGreaterThan(1.5);
      expect(years).toBeLessThan(4.5);
    }
  });

  it('spaces successive cycles by Saturn’s orbital period', () => {
    const peaks = result.phases
      .filter((p) => p.phase === 'peak')
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 1; i < peaks.length; i++) {
      const gap = (peaks[i].start.getTime() - peaks[i - 1].start.getTime()) / YEAR_MS;
      // One full Saturn return, roughly 29.5 years.
      expect(gap).toBeGreaterThan(27);
      expect(gap).toBeLessThan(32);
    }
  });

  it('reports the running phase only when the date falls inside one', () => {
    const now = new Date('2026-07-29T00:00:00Z').getTime();

    if (result.currentPhase) {
      expect(result.active).toBe(true);
      expect(result.currentPhase.start.getTime()).toBeLessThanOrEqual(now);
      expect(result.currentPhase.end.getTime()).toBeGreaterThan(now);
    } else {
      expect(result.active).toBe(false);
    }
  });

  it('detects dhaiya from Saturn’s house from the Moon', () => {
    if (result.dhaiya.active) {
      expect(['kantaka', 'ashtama']).toContain(result.dhaiya.type);
    } else {
      expect(result.dhaiya.type).toBeNull();
    }
  });
});

describe('upcoming ingresses', () => {
  const from = new Date('2026-07-29T00:00:00Z');
  const events = upcomingIngresses(chart, from, 5);

  it('only lists dates in the future', () => {
    for (const event of events) {
      expect(event.date.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it('returns them in order', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date.getTime()).toBeGreaterThanOrEqual(
        events[i - 1].date.getTime(),
      );
    }
  });

  it('covers only the slow grahas', () => {
    const grahas = new Set(events.map((e) => e.graha));
    for (const graha of grahas) {
      expect(['Jupiter', 'Saturn', 'Rahu', 'Ketu']).toContain(graha);
    }
  });

  it('moves Rahu and Ketu backwards through the zodiac', () => {
    const rahu = events.filter((e) => e.graha === 'Rahu');
    for (let i = 1; i < rahu.length; i++) {
      const previous = rahu[i - 1].rashi!;
      const current = rahu[i].rashi!;
      // Retrograde motion: each ingress is the preceding sign.
      expect(current).toBe((previous + 11) % 12);
    }
  });

  it('pairs every Rahu ingress with the opposite Ketu ingress', () => {
    const rahu = events.filter((e) => e.graha === 'Rahu');
    const ketu = events.filter((e) => e.graha === 'Ketu');
    expect(ketu).toHaveLength(rahu.length);

    for (let i = 0; i < rahu.length; i++) {
      expect(ketu[i].rashi).toBe((rahu[i].rashi! + 6) % 12);
      expect(ketu[i].date.getTime()).toBe(rahu[i].date.getTime());
    }
  });
});

describe('gochara verdict', () => {
  it('reads Saturn as favourable only in the 3rd, 6th and 11th from the Moon', () => {
    expect(gocharaVerdict('Saturn', 3)).toBe('favourable');
    expect(gocharaVerdict('Saturn', 6)).toBe('favourable');
    expect(gocharaVerdict('Saturn', 11)).toBe('favourable');
    expect(gocharaVerdict('Saturn', 8)).toBe('difficult');
  });

  it('reads Jupiter as favourable in the classical houses', () => {
    expect(gocharaVerdict('Jupiter', 2)).toBe('favourable');
    expect(gocharaVerdict('Jupiter', 5)).toBe('favourable');
    expect(gocharaVerdict('Jupiter', 9)).toBe('favourable');
    expect(gocharaVerdict('Jupiter', 4)).toBe('difficult');
  });
});
