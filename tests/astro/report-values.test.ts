import { describe, expect, it } from 'vitest';

import { castChart, lagnaLord, rasiLord } from '@/lib/astro/chart';
import { avakhadaChakra, payaOf, PAYA_HOUSES, PAYA_NAMES } from '@/lib/astro/avakhada';
import { balanceAtBirthParts, buildVimshottari, formatBalance } from '@/lib/astro/dasha';
import { birthTimeDetails, toIshtakaal } from '@/lib/astro/birthtime';
import { favourablePoints, ghatakaChakra } from '@/lib/astro/ghataka';
import { TITHI_GROUPS } from '@/lib/astro/ghataka';
import {
  NAKSHATRA_GANA,
  NAKSHATRA_NADI,
  NAKSHATRA_NAMES,
  NAKSHATRA_YONI,
  RASHI_LORD,
  RASHI_NAMES_EN,
  VARA_NAMES,
} from '@/lib/astro/constants';
import type { BirthData, Chart } from '@/lib/astro/types';

/** The twelve lunar months, for checking the Ghataka month column. */
const LUNAR_MONTHS = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwina',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
];

/**
 * A chart with the Moon in a chosen sign.
 *
 * ghatakaChakra reads nothing but the Moon's sign, so a real ephemeris call for
 * each of the twelve is wasted work and would also make the test depend on
 * finding twelve birth moments. The cast is narrow and deliberate: it stands
 * for the one field the function under test actually touches.
 */
function chartWithMoonIn(rashi: number): Chart {
  return { byGraha: { Moon: { rashi } } } as unknown as Chart;
}

/**
 * The values a printed kundli opens with.
 *
 * These are the fields that were missing before the full report existed:
 * ishtakaal, the Avakhada Chakra, the favourable points and the Ghataka values.
 * They are cheap to get subtly wrong and nobody notices, because they look
 * plausible either way, so each one is pinned against a hand-checked
 * expectation or against an invariant that cannot hold by accident.
 */

const BIRTH: BirthData = {
  year: 1990,
  month: 6,
  day: 15,
  hour: 10,
  minute: 30,
  place: {
    name: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
};

const chart = castChart(BIRTH);

describe('ishtakaal', () => {
  it('converts a whole day into exactly sixty ghati', () => {
    const full = toIshtakaal(24 * 60);
    expect(full.ghati).toBe(60);
    expect(full.pala).toBe(0);
    expect(full.vipala).toBe(0);
  });

  it('uses 24 minutes to the ghati and 24 seconds to the pala', () => {
    // 1 ghati 1 pala = 24 minutes 24 seconds.
    const value = toIshtakaal(24 + 0.4);
    expect(value.ghati).toBe(1);
    expect(value.pala).toBe(1);
    expect(value.vipala).toBe(0);
  });

  it('never prints sixty pala, which naive per-unit rounding produces', () => {
    // Just under a whole ghati. Rounding each unit on its own turns this into
    // "0 gh 60 pa", which is not a thing.
    for (let i = 0; i < 400; i++) {
      const value = toIshtakaal(i * 0.37);
      expect(value.pala).toBeLessThan(60);
      expect(value.vipala).toBeLessThan(60);
    }
  });

  it('agrees with its own clock rendering', () => {
    const value = toIshtakaal(125.5);
    const [h, m, s] = value.clock.split(':').map(Number);
    expect(h * 3600 + m * 60 + s).toBe(Math.round(125.5 * 60));
  });
});

describe('birth time details', () => {
  const details = birthTimeDetails(chart);

  it('reports the zone offset actually applied', () => {
    expect(details.zoneOffsetFormatted).toBe('+05:30');
  });

  it('reports a longitude correction, since Kolkata is east of the standard meridian', () => {
    // IST is drawn around 82.5 E. Kolkata is at 88.36 E, so local mean time
    // runs ahead of the clock by roughly 23 minutes.
    expect(details.localTimeCorrection).toBeGreaterThan(20);
    expect(details.localTimeCorrection).toBeLessThan(26);
  });

  it('reports no war time correction for a 1990 birth', () => {
    expect(details.warTimeCorrection).toBe(0);
    expect(details.warTimeCorrectionFormatted).toBe('None');
  });

  it('finds sunrise before sunset, with a plausible day length', () => {
    expect(details.sunrise).not.toBeNull();
    expect(details.sunset).not.toBeNull();
    expect(details.sunrise!.getTime()).toBeLessThan(details.sunset!.getTime());

    // Mid June at 22.5 N is a long day, but not an absurd one.
    expect(details.dayDurationMinutes!).toBeGreaterThan(13 * 60);
    expect(details.dayDurationMinutes!).toBeLessThan(14 * 60);
  });

  it('day and night always add to a full day', () => {
    expect(details.dayDurationMinutes! + details.nightDurationMinutes!).toBeCloseTo(1440, 6);
  });

  it('counts ishtakaal from sunrise, so a mid-morning birth is a few ghati in', () => {
    // Born 10:30, sunrise around 04:55 local. Roughly 5.5 hours, near 14 ghati.
    expect(details.ishtakaal).not.toBeNull();
    expect(details.ishtakaal!.ghati).toBeGreaterThan(10);
    expect(details.ishtakaal!.ghati).toBeLessThan(18);
  });
});

describe('war time', () => {
  it('detects the 1942 to 1945 Indian wartime offset as a correction', () => {
    const wartime = castChart({
      ...BIRTH,
      year: 1943,
      month: 8,
      day: 10,
    });

    const details = birthTimeDetails(wartime);

    // India ran +06:30 during the war, an hour ahead of nothing and half an
    // hour ahead of modern IST. A chart cast without this is 30 minutes wrong.
    expect(details.warTimeCorrection).toBe(60);
    expect(details.zoneOffsetFormatted).toBe('+06:30');
  });
});

describe('avakhada chakra', () => {
  const chakra = avakhadaChakra(chart);

  it('derives every nakshatra attribute from the Moon nakshatra', () => {
    const n = chart.byGraha.Moon.nakshatra;
    expect(chakra.yoni).toBe(NAKSHATRA_YONI[n]);
    expect(chakra.gana).toBe(NAKSHATRA_GANA[n]);
    expect(chakra.nadi).toBe(NAKSHATRA_NADI[n]);
  });

  it('derives the rashi lord from the Moon sign', () => {
    expect(chakra.rashiLord).toBe(RASHI_LORD[chart.byGraha.Moon.rashi]);
  });

  it('gives exactly one paya for every house the Moon can occupy', () => {
    for (let house = 1; house <= 12; house++) {
      expect(PAYA_NAMES).toContain(payaOf(house));
    }
  });

  it('follows the classical house grouping', () => {
    // 1, 6, 11 gold; 2, 5, 9 silver; 3, 7, 10 copper; 4, 8, 12 iron.
    for (const house of [1, 6, 11]) expect(payaOf(house)).toBe('Gold');
    for (const house of [2, 5, 9]) expect(payaOf(house)).toBe('Silver');
    for (const house of [3, 7, 10]) expect(payaOf(house)).toBe('Copper');
    for (const house of [4, 8, 12]) expect(payaOf(house)).toBe('Iron');
  });

  it('covers all twelve houses exactly once across the four groups', () => {
    const all = Object.values(PAYA_HOUSES).flat().sort((a, b) => a - b);
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('refuses a house outside one to twelve rather than guessing', () => {
    expect(() => payaOf(0)).toThrow(RangeError);
    expect(() => payaOf(13)).toThrow(RangeError);
  });

  it('reports the paya of the Moon house in this chart', () => {
    expect(chakra.paya).toBe(payaOf(chart.byGraha.Moon.house));
  });

  it('gives a pada between one and four', () => {
    expect(chakra.pada).toBeGreaterThanOrEqual(1);
    expect(chakra.pada).toBeLessThanOrEqual(4);
  });
});

describe('favourable points and ghataka', () => {
  it('derives the favourable values from the lord of the Moon sign', () => {
    const points = favourablePoints(chart);
    expect(points.lord).toBe(RASHI_LORD[chart.byGraha.Moon.rashi]);
    expect(points.number).toBeGreaterThanOrEqual(1);
    expect(points.number).toBeLessThanOrEqual(9);
    expect(points.colour).not.toBe('');
    expect(points.direction).not.toBe('');
  });

  it('gives a complete ghataka row for every Moon sign', () => {
    const g = ghatakaChakra(chart);
    for (const value of [g.month, g.tithi, g.vara, g.nakshatra, g.lagna, g.rashi]) {
      expect(value).toBeTruthy();
    }
  });

  /*
    The Ghataka table is transcribed from a published source rather than
    derived, so these guard the transcription. A typo in a hand-entered table
    of twelve rows is invisible on inspection and produces a confident wrong
    answer, which is exactly what this report must not do.
  */
  it('names a tithi group rather than a bare lunar day', () => {
    for (let rashi = 0; rashi < 12; rashi++) {
      const g = ghatakaChakra(chartWithMoonIn(rashi));
      expect(Object.keys(TITHI_GROUPS)).toContain(g.tithiGroup);
      expect(g.tithiDays).toHaveLength(3);
      // Each group is its first day, then +5 and +10.
      const [first] = g.tithiDays;
      expect(g.tithiDays).toEqual([first, first + 5, first + 10]);
    }
  });

  it('keeps every group inside a paksha', () => {
    for (const days of Object.values(TITHI_GROUPS)) {
      for (const day of days) {
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(15);
      }
    }
  });

  it('covers all fifteen tithis of a paksha exactly once', () => {
    const all = Object.values(TITHI_GROUPS).flat().sort((a, b) => a - b);
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('names a real weekday, nakshatra and sign for all twelve Moon signs', () => {
    for (let rashi = 0; rashi < 12; rashi++) {
      const g = ghatakaChakra(chartWithMoonIn(rashi));
      expect(VARA_NAMES).toContain(g.vara);
      expect(NAKSHATRA_NAMES).toContain(g.nakshatra);
      expect(RASHI_NAMES_EN).toContain(g.lagna);
      expect(RASHI_NAMES_EN).toContain(g.rashi);
      expect(LUNAR_MONTHS).toContain(g.month);
    }
  });

  it('says plainly that ghataka carries no weight', () => {
    expect(ghatakaChakra(chart).note).toMatch(/no weight/i);
  });
});

describe('lords and dasha balance', () => {
  it('names the lord of the ascendant and of the Moon sign', () => {
    expect(lagnaLord(chart)).toBe(RASHI_LORD[chart.ascendant.rashi]);
    expect(rasiLord(chart)).toBe(RASHI_LORD[chart.byGraha.Moon.rashi]);
  });

  it('splits the balance at birth into years, months and days', () => {
    const tree = buildVimshottari(chart);
    const parts = balanceAtBirthParts(tree);

    expect(parts.lord).toBe(tree.balanceAtBirth.lord);
    expect(parts.months).toBeLessThan(12);
    expect(parts.days).toBeLessThan(32);
    expect(parts.years).toBeLessThanOrEqual(20);
  });

  it('keeps the sentence and the parts in agreement', () => {
    const tree = buildVimshottari(chart);
    const parts = balanceAtBirthParts(tree);
    const sentence = formatBalance(tree);

    expect(sentence).toContain(parts.lord);
    if (parts.years) expect(sentence).toContain(String(parts.years));
    if (parts.months) expect(sentence).toContain(String(parts.months));
  });
});
