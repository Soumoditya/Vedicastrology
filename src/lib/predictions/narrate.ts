import 'server-only';

import { checkSafety, SAFETY_INSTRUCTIONS, type SafetyResult } from './safety';
import { topSignals, type SignalSet } from './signals';

/**
 * The narration layer.
 *
 * The engine computes, the writer only writes. The model is handed a list of
 * findings and asked to express them in readable prose. It is never asked what
 * a chart means, and it is told explicitly that anything not in the list must
 * not appear. That arrangement is what makes the output checkable: every claim
 * traces back to a signal, and a signal traces back to a rule.
 *
 * The output is then run through the safety filter regardless of what the
 * prompt said, because a prompt is a request and a filter is a rule.
 *
 * With no API key configured this returns `unavailable` rather than throwing.
 * The prediction pages fall back to showing the signals themselves, which are
 * the substance anyway, so the site works fully before the key exists and
 * gains prose the moment it does.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Overridable, so a model change is an environment variable and not a deploy. */
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

export type NarrationStatus = 'ready' | 'held' | 'blocked' | 'unavailable' | 'error';

export interface Narration {
  status: NarrationStatus;
  text: string | null;
  safety: SafetyResult | null;
  /** Present when something went wrong, for the admin screen. */
  detail?: string;
  model?: string;
}

export function narrationConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const VOICE = `
You are writing for a Vedic astrology site that shows its working. The tone is
plain, warm and unhurried. It is a knowledgeable person talking, not a
marketing page and not a fortune teller.

Do not use em dashes.
Do not open with a greeting or a restatement of the question.
Do not use headings, bullet points or bold text. Write paragraphs.
Do not use the words destiny, fate, cosmic, energies, vibrations, blessed,
or manifest.
Do not flatter the reader.
`.trim();

/**
 * Turn a set of signals into prose.
 *
 * `editorial` is the site owner's own interpretation text, passed straight
 * through to the model. It exists so the writing follows one astrologer's
 * reading of a rule rather than whatever the model absorbed from the internet.
 */
export async function narrate({
  signals,
  editorial,
  audience = 'the person whose chart this is',
  maxWords,
}: {
  signals: SignalSet;
  editorial?: string;
  audience?: string;
  maxWords?: number;
}): Promise<Narration> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: 'unavailable', text: null, safety: null };

  const chosen = topSignals(signals);

  const words =
    maxWords ??
    { day: 130, week: 220, month: 400, year: 700 }[signals.period.name];

  const findings = chosen
    .map(
      (s, i) =>
        `${i + 1}. [${s.tone}, weight ${s.weight}] ${s.statement}\n   Rule: ${s.rule}`,
    )
    .join('\n');

  const prompt = `
${VOICE}

${SAFETY_INSTRUCTIONS}

You are given findings from a Vedic astrology engine. Write a ${signals.period.name}
reading for ${audience}, of about ${words} words.

Absolute constraint: every claim you make must come from the findings below.
You may connect them, weigh them against each other and say which matters
most. You may not introduce any astrological factor that is not listed, and
you may not invent an outcome that the findings do not support. If the
findings are thin, write something short rather than filling space.

Chart context:
  Ascendant: ${signals.context.ascendant}
  Moon sign: ${signals.context.moonRashi}
  Running dasha: ${signals.context.dasha}
  Sade Sati: ${signals.context.sadeSatiPhase ?? 'not running'}

Findings, heaviest first:
${findings}
${editorial ? `\nThe astrologer's own notes on how to read these. Follow them where they apply:\n${editorial}\n` : ''}
Write the reading now. Prose only.
`.trim();

  try {
    const response = await fetch(
      `${ENDPOINT}/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            // Low but not zero. At zero the prose reads mechanically, and the
            // findings constrain the content anyway.
            temperature: 0.6,
            maxOutputTokens: Math.ceil(words * 2.2),
          },
        }),
        // A reading is generated once per person per period and cached, so a
        // slow call is acceptable. A hanging one is not.
        signal: AbortSignal.timeout(45_000),
      },
    );

    if (!response.ok) {
      return {
        status: 'error',
        text: null,
        safety: null,
        detail: `Model returned ${response.status}.`,
        model: MODEL,
      };
    }

    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const raw = body.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!raw) {
      return { status: 'error', text: null, safety: null, detail: 'Empty response.', model: MODEL };
    }

    // Em dashes are asked for in the prompt and removed here anyway, because
    // an instruction is not a guarantee and this one is a house style rule.
    const text = raw.replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, ', ');

    const safety = checkSafety(text);

    return {
      status: safety.blocked ? 'blocked' : safety.clean ? 'ready' : 'held',
      text,
      safety,
      model: MODEL,
    };
  } catch (error) {
    return {
      status: 'error',
      text: null,
      safety: null,
      detail: error instanceof Error ? error.message : 'Request failed.',
      model: MODEL,
    };
  }
}
