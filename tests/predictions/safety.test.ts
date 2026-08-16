import { describe, expect, it } from 'vitest';

import { checkSafety, SAFETY_RULES } from '@/lib/predictions/safety';

/**
 * The safety filter.
 *
 * This is the last thing between a generated reading and a reader, so it gets
 * tested from both directions: it must catch what it is for, and it must not
 * catch text that says the opposite.
 *
 * The negation exemption is the part that needs watching. It was added because
 * a reading containing "nothing here is a reason to delay seeing a doctor" was
 * being blocked by the medical rule, which is the most responsible sentence in
 * the document triggering the rule meant to protect the reader. Loosening a
 * safety filter is exactly the kind of change that quietly opens a hole, so the
 * abuse cases are pinned here alongside the fix.
 */

describe('what the filter must catch', () => {
  const mustBlock: [string, string][] = [
    ['lifespan', 'This placement shows you will die at the age of sixty two.'],
    ['medical_avoidance', 'You should stop taking your medication during this dasha.'],
    ['medical_avoidance', 'Avoid surgery until Jupiter turns direct.'],
    ['medical_avoidance', 'Pray rather than seeing a doctor about it.'],
  ];

  for (const [rule, text] of mustBlock) {
    it(`blocks: ${text}`, () => {
      const verdict = checkSafety(text);
      expect(verdict.blocked).toBe(true);
      expect(verdict.findings.map((f) => f.rule.id)).toContain(rule);
    });
  }
});

describe('the negation exemption', () => {
  const mustPass = [
    'Nothing here is a reason to delay seeing a doctor.',
    'This is not a reason to postpone treatment of any kind.',
    'No reason to avoid medication comes out of a chart.',
  ];

  for (const text of mustPass) {
    it(`allows: ${text}`, () => {
      expect(checkSafety(text).blocked).toBe(false);
    });
  }

  /*
    The exemption must not be usable as a prefix that launders real advice.
    Each of these opens with a negation somewhere and then gives the dangerous
    instruction anyway, in its own clause or its own sentence.
  */
  const mustStillBlock = [
    'There is no reason to worry. Stop taking your medication this month.',
    'Nothing is certain, but you should avoid surgery until the transit passes.',
    'This is not a reason to celebrate, and you should skip your treatment.',
    'No matter what anyone says, delay chemotherapy until Saturn moves.',
  ];

  for (const text of mustStillBlock) {
    it(`still blocks: ${text}`, () => {
      expect(checkSafety(text).blocked).toBe(true);
    });
  }
});

describe('ordinary Jyotish prose', () => {
  /*
    The rules are written over phrasing rather than topic on purpose, because
    the eighth house is about death and longevity and a reading has to be able
    to discuss it without being blocked.
  */
  const mustPass = [
    'Saturn in the eighth house is read for longevity and for what is inherited.',
    'The eighth house concerns death, inheritance and matters kept hidden.',
    'Mars in the sixth can show a tendency to accidents, so ordinary care on the road is worth keeping.',
    'This period favours starting the work you have been putting off.',
  ];

  for (const text of mustPass) {
    it(`allows: ${text}`, () => {
      expect(checkSafety(text).blocked).toBe(false);
    });
  }
});

describe('the rule set itself', () => {
  it('gives every rule an id, a reason and a severity', () => {
    for (const rule of SAFETY_RULES) {
      expect(rule.id).toMatch(/^[a-z_]+$/);
      expect(rule.reason.length).toBeGreaterThan(10);
      expect(['block', 'review']).toContain(rule.severity);
    }
  });

  it('has no duplicate ids', () => {
    const ids = SAFETY_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not carry the global flag, which would make matching stateful', () => {
    // A /g regex keeps lastIndex between calls, so the same text would pass on
    // one call and fail on the next. Silent, intermittent, and very hard to
    // reproduce from a bug report.
    for (const rule of SAFETY_RULES) {
      expect(rule.pattern.global).toBe(false);
    }
  });

  it('treats clean text as publishable and anything flagged as not', () => {
    expect(checkSafety('Jupiter aspects the fifth house.').clean).toBe(true);
    expect(checkSafety('You are guaranteed to succeed this year.').clean).toBe(false);
  });
});
