import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { buildVarga, vargaRashi } from '@/lib/astro/divisional';
import { buildVimshottari, dashaAt } from '@/lib/astro/dasha';
import { resolveTime } from '@/lib/astro/time';
import { computePanchang } from '@/lib/astro/panchang';
import { describeLongitude } from '@/lib/astro/zodiac';
import type { BirthData } from '@/lib/astro/types';

/**
 * Accuracy tests.
 *
 * The expected longitudes below were produced by the Swiss Ephemeris directly,
 * independently of this engine's own code paths, and are asserted to one
 * arc-second. They exist to catch silent drift: a change to the ayanamsa
 * handling, the node type or the time conversion would move these values while
 * still producing a chart that *looks* perfectly reasonable.
 */

/** One arc-second, in degrees. */
const ARCSEC = 1 / 3600;

/** Reference nativity: 15 August 1990, 10:30 IST, Kolkata. */
const REFERENCE: BirthData = {
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
};

/** Sidereal longitudes, Lahiri ayanamsa, mean node. */
const EXPECTED_LONGITUDES: Record<string, number> = {
  Sun: 118.394967,
  Moon: 48.929914,
  Mars: 27.486892,
  Mercury: 145.445944,
  Jupiter: 95.606675,
  Venus: 97.842550,
  Saturn: 266.147906,
  Rahu: 282.753528,
};

describe('chart accuracy', () => {
  const chart = castChart(REFERENCE);

  it('resolves the birth moment to the correct UT', () => {
    expect(chart.meta.utcISO).toBe('1990-08-15T05:00:00.000Z');
    expect(chart.meta.utcOffsetMinutes).toBe(330);
    expect(chart.meta.timezone).toBe('Asia/Kolkata');
    expect(chart.meta.historicalOffset).toBe(false);
  });

  it('computes the Lahiri ayanamsa', () => {
    expect(chart.meta.ayanamsaValue).toBeCloseTo(23.730130, 5);
  });

  it('places every graha to within one arc-second', () => {
    for (const [graha, expected] of Object.entries(EXPECTED_LONGITUDES)) {
      const actual = chart.byGraha[graha].longitude;
      expect(
        Math.abs(actual - expected),
        `${graha}: expected ${expected}, got ${actual}`,
      ).toBeLessThan(ARCSEC);
    }
  });

  it('places Ketu exactly opposite Rahu', () => {
    const separation = Math.abs(
      chart.byGraha.Ketu.longitude - chart.byGraha.Rahu.longitude,
    );
    expect(separation).toBeCloseTo(180, 9);
  });

  it('computes the ascendant', () => {
    expect(chart.ascendant.longitude).toBeCloseTo(189.838208, 4);
    expect(chart.ascendant.rashi).toBe(6); // Libra
  });

  it('identifies dignities correctly', () => {
    expect(chart.byGraha.Moon.dignity).toBe('exalted'); // Taurus
    expect(chart.byGraha.Jupiter.dignity).toBe('exalted'); // Cancer
    expect(chart.byGraha.Mars.dignity).toBe('own'); // Aries
  });

  it('flags retrograde motion', () => {
    expect(chart.byGraha.Saturn.retrograde).toBe(true);
    expect(chart.byGraha.Sun.retrograde).toBe(false);
    // The mean node is always retrograde.
    expect(chart.byGraha.Rahu.retrograde).toBe(true);
  });

  it('assigns whole-sign houses from the ascendant', () => {
    expect(chart.byGraha.Sun.house).toBe(10); // Cancer, 10th from Libra
    expect(chart.byGraha.Moon.house).toBe(8); // Taurus, 8th from Libra
    expect(chart.byGraha.Saturn.house).toBe(3); // Sagittarius, 3rd from Libra
  });

  it('derives the Moon nakshatra and pada', () => {
    const moon = chart.byGraha.Moon;
    expect(moon.nakshatra).toBe(3); // Rohini
    expect(moon.pada).toBe(3);
    expect(moon.nakshatraLord).toBe('Moon');
  });
});

describe('divisional charts', () => {
  const chart = castChart(REFERENCE);

  it('builds the navamsa with the standard starting rule', () => {
    const d9 = buildVarga(chart, 'D9');
    // Taurus is a fixed sign, so its navamsa count begins at Capricorn.
    expect(d9.placements.find((p) => p.graha === 'Moon')!.rashi).toBe(2); // Gemini
    expect(d9.ascendantRashi).toBe(8); // Sagittarius
  });

  it('starts each navamsa group from the correct sign', () => {
    // Movable signs begin from themselves.
    expect(vargaRashi(0, 'D9')).toBe(0); // Aries 0° → Aries
    // Fixed signs begin from the ninth.
    expect(vargaRashi(30, 'D9')).toBe(9); // Taurus 0° → Capricorn
    // Dual signs begin from the fifth.
    expect(vargaRashi(60, 'D9')).toBe(6); // Gemini 0° → Libra
  });

  it('applies the unequal trimsamsa divisions', () => {
    // Odd sign: Mars 0–5, Saturn 5–10, Jupiter 10–18, Mercury 18–25, Venus 25–30.
    expect(vargaRashi(2, 'D30')).toBe(0); // Aries 2° → Aries (Mars)
    expect(vargaRashi(7, 'D30')).toBe(10); // Aries 7° → Aquarius (Saturn)
    expect(vargaRashi(20, 'D30')).toBe(2); // Aries 20° → Gemini (Mercury)
    // Even sign: Venus 0–5, Mercury 5–12, Jupiter 12–20, Saturn 20–25, Mars 25–30.
    expect(vargaRashi(32, 'D30')).toBe(1); // Taurus 2° → Taurus (Venus)
    expect(vargaRashi(45, 'D30')).toBe(11); // Taurus 15° → Pisces (Jupiter)
  });

  it('maps the hora by half-sign', () => {
    expect(vargaRashi(5, 'D2')).toBe(4); // Odd sign, first half → Leo
    expect(vargaRashi(20, 'D2')).toBe(3); // Odd sign, second half → Cancer
    expect(vargaRashi(35, 'D2')).toBe(3); // Even sign, first half → Cancer
  });

  it('maps the drekkana by thirds', () => {
    expect(vargaRashi(5, 'D3')).toBe(0); // Aries 5° → Aries
    expect(vargaRashi(15, 'D3')).toBe(4); // Aries 15° → Leo (5th)
    expect(vargaRashi(25, 'D3')).toBe(8); // Aries 25° → Sagittarius (9th)
  });
});

describe('vimshottari dasha', () => {
  const chart = castChart(REFERENCE);
  const tree = buildVimshottari(chart, { maxLevel: 3 });

  it('seeds from the Moon nakshatra', () => {
    expect(tree.seedNakshatra).toBe(3); // Rohini
    expect(tree.balanceAtBirth.lord).toBe('Moon');
    // 10-year Moon dasha, roughly two thirds already elapsed at birth.
    expect(tree.balanceAtBirth.yearsRemaining).toBeCloseTo(3.3026, 3);
  });

  it('runs the mahadashas in Vimshottari order', () => {
    expect(tree.periods.map((p) => p.lord)).toEqual([
      'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn',
      'Mercury', 'Ketu', 'Venus', 'Sun',
    ]);
  });

  it('starts at birth and joins each period to the next', () => {
    expect(tree.periods[0].start.toISOString()).toBe('1990-08-15T05:00:00.000Z');
    for (let i = 1; i < tree.periods.length; i++) {
      expect(tree.periods[i].start.getTime()).toBe(tree.periods[i - 1].end.getTime());
    }
  });

  it('gives each mahadasha its full nominal length', () => {
    // Mars: 7 years of 365.25 days.
    const mars = tree.periods[1];
    const days = (mars.end.getTime() - mars.start.getTime()) / 86_400_000;
    expect(days).toBeCloseTo(7 * 365.25, 6);
  });

  it('divides sub-periods proportionally and exactly fills the parent', () => {
    const maha = tree.periods[1]; // Mars
    const children = maha.children!;
    expect(children[0].lord).toBe('Mars'); // antardasha starts with its own lord
    expect(children[0].start.getTime()).toBe(maha.start.getTime());
    expect(children[children.length - 1].end.getTime()).toBe(maha.end.getTime());

    // Mars/Venus = 7 × 20 / 120 years.
    const venus = children.find((c) => c.lord === 'Venus')!;
    const days = (venus.end.getTime() - venus.start.getTime()) / 86_400_000;
    expect(days).toBeCloseTo((7 * 20 / 120) * 365.25, 3);
  });

  it('finds the period running at a given date', () => {
    const active = dashaAt(tree, new Date('2026-07-29T00:00:00Z'));
    expect(active).not.toBeNull();
    expect(active!.maha.lord).toBe('Jupiter');
    expect(active!.antar).toBeDefined();
  });
});

describe('historical and daylight-saving time', () => {
  const place = {
    name: 'Kolkata, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  };

  it('applies India’s 1942–45 wartime offset of +06:30', () => {
    const t = resolveTime({
      year: 1943, month: 5, day: 10, hour: 10, minute: 30, place,
    });
    expect(t.offsetMinutes).toBe(390);
    expect(t.historicalOffset).toBe(true);
    expect(t.utcISO).toBe('1943-05-10T04:00:00.000Z');
  });

  it('applies Madras Mean Time (+05:21:10) before 1906', () => {
    const t = resolveTime({
      year: 1900, month: 3, day: 3, hour: 6, minute: 0, place,
    });
    // 5h 21m 10s expressed in minutes.
    expect(t.offsetMinutes).toBeCloseTo(321.1667, 3);
    expect(t.historicalOffset).toBe(true);
  });

  it('uses the modern +05:30 offset for recent births', () => {
    const t = resolveTime({
      year: 1990, month: 8, day: 15, hour: 10, minute: 30, place,
    });
    expect(t.offsetMinutes).toBe(330);
    expect(t.historicalOffset).toBe(false);
  });

  it('handles US daylight saving on both sides of the boundary', () => {
    const nyc = {
      name: 'New York, USA',
      latitude: 40.7128,
      longitude: -74.006,
      timezone: 'America/New_York',
    };
    const summer = resolveTime({
      year: 1985, month: 7, day: 4, hour: 13, minute: 15, place: nyc,
    });
    expect(summer.offsetMinutes).toBe(-240);
    expect(summer.daylightSaving).toBe(true);

    const winter = resolveTime({
      year: 1985, month: 1, day: 4, hour: 13, minute: 15, place: nyc,
    });
    expect(winter.offsetMinutes).toBe(-300);
    expect(winter.daylightSaving).toBe(false);
  });

  it('resolves a time zone from coordinates alone', () => {
    const t = resolveTime({
      year: 2000, month: 6, day: 1, hour: 12, minute: 0,
      place: { name: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
    });
    expect(t.timezone).toBe('Asia/Kolkata');
  });
});

describe('panchang', () => {
  const place = {
    name: 'Kolkata, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  };

  const panchang = computePanchang({ year: 2026, month: 7, day: 29 }, place);

  it('names the weekday from the local date, not the UT date', () => {
    // Sunrise in India falls on the previous UT date, so a naive Julian Day
    // conversion reports Tuesday here.
    expect(panchang.vara.nameEn).toBe('Wednesday');
    expect(panchang.vara.lord).toBe('Mercury');
  });

  it('finds sunrise and sunset', () => {
    expect(panchang.sunrise).toBeTruthy();
    expect(panchang.sunset).toBeTruthy();
    expect(panchang.sunset!.getTime()).toBeGreaterThan(panchang.sunrise!.getTime());
  });

  it('computes all five limbs with end times', () => {
    expect(panchang.tithi.name).toBeTruthy();
    expect(panchang.tithi.endsAt).toBeTruthy();
    expect(panchang.nakshatra.endsAt).toBeTruthy();
    expect(panchang.yoga.endsAt).toBeTruthy();
    expect(panchang.karana.endsAt).toBeTruthy();
    expect(panchang.tithi.elapsed).toBeGreaterThanOrEqual(0);
    expect(panchang.tithi.elapsed).toBeLessThan(1);
  });

  it('omits Abhijit on Wednesday, as tradition requires', () => {
    expect(panchang.muhurta.abhijit).toBeNull();
  });

  it('places Rahu Kaal in the fifth eighth of Wednesday’s daylight', () => {
    const { sunrise, sunset, muhurta } = panchang;
    const eighth = (sunset!.getTime() - sunrise!.getTime()) / 8;
    const expectedStart = sunrise!.getTime() + 4 * eighth;
    expect(muhurta.rahuKaal!.start.getTime()).toBeCloseTo(expectedStart, -3);
  });
});

describe('zodiac decomposition', () => {
  it('splits a longitude into rashi, nakshatra and pada', () => {
    const p = describeLongitude(48.929914);
    expect(p.rashi).toBe(1); // Taurus
    expect(p.degreeInRashi).toBeCloseTo(18.929914, 6);
    expect(p.nakshatra).toBe(3); // Rohini
    expect(p.pada).toBe(3);
  });

  it('normalises angles outside 0–360', () => {
    expect(describeLongitude(-10).rashi).toBe(11); // Pisces
    expect(describeLongitude(370).rashi).toBe(0); // Aries
  });

  it('puts each nakshatra boundary in the right sign', () => {
    expect(describeLongitude(0).nakshatra).toBe(0); // Ashwini
    expect(describeLongitude(13.3333).nakshatra).toBe(0);
    expect(describeLongitude(13.3334).nakshatra).toBe(1); // Bharani
    expect(describeLongitude(359.9).nakshatra).toBe(26); // Revati
  });
});
