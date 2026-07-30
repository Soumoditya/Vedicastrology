/**
 * The safety filter.
 *
 * Applied to generated text before anything is published, and applied again
 * regardless of what the prompt said, because a prompt is a request and a
 * filter is a rule.
 *
 * This is not squeamishness. An astrology site that tells somebody their
 * illness is fatal, or that they should postpone treatment until a transit
 * passes, causes real harm, and is also how a business ends up in court. The
 * cost of holding a reading back for review is a delay. The cost of publishing
 * one of these is not recoverable.
 *
 * Anything that trips a rule is held for review rather than deleted, so
 * nothing disappears silently and a false positive costs a moment of reading
 * rather than a lost draft.
 */

export type Severity = 'block' | 'review';

export interface SafetyRule {
  id: string;
  /** Why this matters, in a sentence, for the admin review screen. */
  reason: string;
  severity: Severity;
  pattern: RegExp;
}

/*
  Written as patterns over phrasing rather than topics. "Death" appears
  legitimately in Jyotish writing about the eighth house, so the rules target
  the act of predicting one, not the word.
*/
export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'lifespan',
    reason: 'Predicts death, lifespan or the timing of either.',
    severity: 'block',
    pattern:
      /\b(you|your|he|she|they)\s+(will|shall|are going to|may)\s+\w*\s*(die|pass away|not survive)\b|\b(life ?span|longevity)\s+(of|is|will be)\s+\d|\byears? (left|remaining) to live\b|\bdate of (your )?death\b/i,
  },
  {
    id: 'fatal_illness',
    reason: 'Predicts a fatal or terminal illness.',
    severity: 'block',
    pattern: /\b(terminal|fatal|incurable)\s+(illness|disease|condition|cancer)\b|\bwill (develop|contract|get)\s+(cancer|a tumour|a tumor|hiv|aids)\b/i,
  },
  {
    id: 'medical_avoidance',
    reason: 'Suggests delaying, avoiding or replacing medical treatment.',
    severity: 'block',
    pattern:
      /\b(avoid|delay|postpone|skip|stop|refuse|do not (take|have|get))\b[^.]{0,60}\b(treatment|surgery|operation|medication|medicine|doctor|chemotherapy|vaccine|vaccination|insulin|therapy)\b|\b(instead of|rather than)\s+(seeing a doctor|medical treatment|medicine)\b/i,
  },
  {
    id: 'diagnosis',
    reason: 'States a medical diagnosis.',
    severity: 'review',
    pattern:
      /\byou (have|are suffering from|suffer from)\s+(cancer|diabetes|depression|schizophrenia|a tumour|a tumor|heart disease|kidney (failure|disease))\b|\bdiagnos(is|ed|e) (of|with)\b/i,
  },
  {
    id: 'pregnancy_certainty',
    reason: 'Makes a definite claim about conception, pregnancy or a child’s sex.',
    severity: 'review',
    pattern:
      /\b(will|are going to)\s+(conceive|become pregnant|have a (son|daughter|boy|girl))\b|\b(cannot|will never|will not) (conceive|have children)\b|\bthe child will be a (boy|girl|son|daughter)\b/i,
  },
  {
    id: 'financial_instruction',
    reason: 'Gives specific financial or investment instruction.',
    severity: 'review',
    pattern:
      /\b(buy|sell|invest in|put your money (in|into)|take (out )?a loan)\b[^.]{0,50}\b(shares?|stocks?|crypto|bitcoin|property|gold|mutual funds?)\b|\bguaranteed (returns?|profit)\b/i,
  },
  {
    id: 'legal_instruction',
    reason: 'Gives legal instruction or predicts the outcome of a case.',
    severity: 'review',
    pattern:
      /\byou (will|are going to) win (the|your) (case|lawsuit|litigation)\b|\b(file|do not file|drop) (the|a|your) (case|lawsuit|petition|divorce)\b/i,
  },
  {
    id: 'third_party',
    reason: 'Makes a claim about a named third party.',
    severity: 'review',
    pattern:
      /\byour (spouse|husband|wife|partner|mother|father|brother|sister|child|son|daughter|boss) (is|was|will be|has been|may be|might be)( being)?\s+(unfaithful|cheating|lying|dishonest|deceiving|deceitful|betraying)\b/i,
  },
  {
    id: 'fear_selling',
    reason: 'Uses fear to push a purchase, which this site does not do.',
    severity: 'review',
    pattern:
      /\b(only|unless)\s+[^.]{0,40}\b(remedy|puja|pooja|gemstone|yantra|consultation)\b[^.]{0,40}\b(can save|will save|protect you from (ruin|disaster|death))\b|\bgrave danger unless\b/i,
  },
  {
    id: 'absolute_certainty',
    reason: 'States an outcome as certain rather than as a tendency.',
    severity: 'review',
    pattern:
      /\b(it is certain that|there is no doubt that|guaranteed to|definitely will|100% (sure|certain))\b/i,
  },
];

export interface SafetyResult {
  /** True when nothing tripped and the text may publish automatically. */
  clean: boolean;
  /** True when a blocking rule matched. Never publish, with or without review. */
  blocked: boolean;
  findings: { rule: SafetyRule; excerpt: string }[];
}

export function checkSafety(text: string): SafetyResult {
  const findings: SafetyResult['findings'] = [];

  for (const rule of SAFETY_RULES) {
    const match = rule.pattern.exec(text);
    if (!match) continue;

    // Keep a little context either side so the review screen shows the
    // sentence rather than a fragment.
    const from = Math.max(0, match.index - 60);
    const to = Math.min(text.length, match.index + match[0].length + 60);

    findings.push({
      rule,
      excerpt: (from > 0 ? '…' : '') + text.slice(from, to).trim() + (to < text.length ? '…' : ''),
    });
  }

  return {
    clean: findings.length === 0,
    blocked: findings.some((f) => f.rule.severity === 'block'),
    findings,
  };
}

/**
 * The instructions handed to the writer.
 *
 * Kept beside the filter deliberately. When a rule is added here it should be
 * added there too, and a prompt that drifts away from the filter it is paired
 * with is how content that reads fine starts getting held back for no obvious
 * reason.
 */
export const SAFETY_INSTRUCTIONS = `
Never predict death, lifespan, or the timing of either, for anybody.
Never diagnose an illness, and never suggest delaying, avoiding or replacing
medical treatment. Where health appears, describe it as an area to look after
and say plainly that a doctor is the person to ask.
Never give legal or financial instruction, and never predict the outcome of a
case or an investment.
Never make claims about the honesty or conduct of a named third party.
Never use fear to push a remedy, a consultation or a purchase.
Write in tendencies, not certainties. "This period tends to" rather than "this
will".
`.trim();
