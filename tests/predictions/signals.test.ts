import { describe, expect, it } from 'vitest';

import { castChart } from '@/lib/astro/chart';
import { extractSignals, topSignals } from '@/lib/predictions/signals';
import { checkSafety, SAFETY_RULES } from '@/lib/predictions/safety';
import type { BirthData } from '@/lib/astro/types';

const birth: BirthData = {
  year: 1990,
  month: 8,
  day: 15,
  hour: 10,
  minute: 30,
  place: {
    name: 'Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
  },
};

const chart = castChart(birth);

// A fixed instant, so these assertions do not change meaning tomorrow.
const at = new Date('2026-07-29T00:00:00Z');

describe('signal extraction', () => {
  it('is deterministic for the same chart and instant', () => {
    const a = extractSignals(chart, 'month', at);
    const b = extractSignals(chart, 'month', at);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('always produces a dasha signal, which every reading rests on', () => {
    for (const period of ['day', 'week', 'month', 'year'] as const) {
      const set = extractSignals(chart, period, at);
      expect(set.signals.some((s) => s.kind === 'dasha')).toBe(true);
      expect(set.context.dasha).not.toBe('none');
    }
  });

  it('gives every signal a rule and a factual statement', () => {
    const set = extractSignals(chart, 'month', at);

    for (const signal of set.signals) {
      expect(signal.rule.length).toBeGreaterThan(20);
      expect(signal.statement.length).toBeGreaterThan(20);
      expect(signal.code).toMatch(/^[a-z_]+\./);
      expect(['supportive', 'difficult', 'mixed']).toContain(signal.tone);
      expect(signal.weight).toBeGreaterThanOrEqual(1);
      expect(signal.weight).toBeLessThanOrEqual(6);
    }
  });

  it('states what the chart does, never what it means', () => {
    /*
      The whole architecture depends on this. If interpretation leaks into the
      signals, the writer is no longer expressing findings it was handed, and
      the output stops being checkable.
    */
    const set = extractSignals(chart, 'year', at);
    const interpretive =
      /\b(you will|you should|expect|lucky|unlucky|fortune|beware|avoid|danger)\b/i;

    for (const signal of set.signals) {
      expect(signal.statement, signal.code).not.toMatch(interpretive);
    }
  });

  it('sorts by weight so a short reading keeps the important things', () => {
    const set = extractSignals(chart, 'month', at);
    const weights = set.signals.map((s) => s.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  });

  it('drops the fast grahas from long periods and keeps them in short ones', () => {
    const day = extractSignals(chart, 'day', at);
    const year = extractSignals(chart, 'year', at);

    const fast = (set: typeof day) =>
      set.signals.filter((s) => s.kind === 'transit' && s.grahas.includes('Mercury'));

    expect(fast(day).length).toBeGreaterThan(0);
    expect(fast(year)).toHaveLength(0);
  });

  it('trims to a sensible number for the period', () => {
    expect(topSignals(extractSignals(chart, 'day', at)).length).toBeLessThanOrEqual(4);
    expect(topSignals(extractSignals(chart, 'year', at)).length).toBeLessThanOrEqual(14);
  });

  it('keeps every window inside or overlapping the period it describes', () => {
    const set = extractSignals(chart, 'month', at);
    const end = new Date(set.period.end).getTime();

    for (const signal of set.signals) {
      if (!signal.window) continue;
      // A dasha started long ago and runs long after; what must never happen
      // is a window that begins after the period it is reported in.
      expect(new Date(signal.window.start).getTime(), signal.code).toBeLessThanOrEqual(end);
    }
  });
});

describe('safety filter', () => {
  const passes = [
    'This period tends to bring work to the surface. Saturn asks for patience rather than speed.',
    'The eighth house is emphasised, which classically covers inheritance, research and things that are hidden.',
    'Health is worth looking after this month. If something is bothering you, a doctor is the person to ask, not a chart.',
    'Jupiter transits your tenth. Where work is concerned this is usually a supportive stretch.',
  ];

  const blocked = [
    'You will die in your sixty second year, as the eighth lord shows.',
    'This transit indicates a terminal illness developing.',
    'Avoid surgery until Saturn leaves this sign, whatever the doctors say.',
    'Do not take medication during this period.',
  ];

  const held = [
    'You have diabetes, shown by the sixth house affliction.',
    'You will conceive this year and the child will be a boy.',
    'Buy property in the Jupiter period for guaranteed returns.',
    'You will win the case in court.',
    'Your husband is being unfaithful, as Venus shows.',
    'It is certain that this period brings a promotion.',
  ];

  it('lets ordinary astrological writing through', () => {
    for (const text of passes) {
      const result = checkSafety(text);
      expect(result.clean, `${text} :: ${result.findings.map((f) => f.rule.id).join(',')}`).toBe(true);
    }
  });

  it('blocks predictions of death and interference with treatment', () => {
    for (const text of blocked) {
      const result = checkSafety(text);
      expect(result.blocked, text).toBe(true);
      expect(result.clean).toBe(false);
    }
  });

  it('holds the rest for review rather than deleting them', () => {
    for (const text of held) {
      const result = checkSafety(text);
      expect(result.clean, text).toBe(false);
      expect(result.blocked, text).toBe(false);
    }
  });

  it('reports which rule fired, with enough text to judge it', () => {
    const result = checkSafety(
      'A long preamble about the chart, and then: you will win the case in court, without doubt.',
    );
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule.reason.length).toBeGreaterThan(10);
    expect(result.findings[0].excerpt).toContain('case');
  });

  it('gives every rule a distinct id and a stated reason', () => {
    const ids = SAFETY_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of SAFETY_RULES) {
      expect(rule.reason.length).toBeGreaterThan(10);
      expect(['block', 'review']).toContain(rule.severity);
    }
  });

  it('does not trip on the word death used descriptively', () => {
    // The eighth house is discussed constantly in Jyotish writing. A filter
    // that fires on the topic rather than the prediction is useless.
    expect(
      checkSafety(
        'The eighth house is the house of death and of things that are hidden, and Saturn there slows matters down.',
      ).clean,
    ).toBe(true);
  });
});
