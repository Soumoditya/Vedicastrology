import type { Signal } from '@/lib/predictions/signals';

const TONE_COLOR: Record<Signal['tone'], string> = {
  supportive: 'var(--color-benefic)',
  difficult: 'var(--color-malefic)',
  mixed: 'var(--color-gold-500)',
};

const KIND_LABEL: Record<Signal['kind'], string> = {
  dasha: 'Daśā',
  dasha_change: 'Period change',
  transit: 'Gochara',
  sade_sati: 'Sade Sati',
  yoga: 'Yoga',
  strength: 'Aṣṭakavarga',
  retrograde: 'Retrograde',
  ingress: 'Ingress',
};

/**
 * What the engine found, shown rather than hidden.
 *
 * This is the part that makes a reading checkable. Each row is a statement of
 * fact with the classical rule beside it, so somebody can take a claim in the
 * prose, find the finding it came from, and look the rule up in a text. A
 * prediction page without this is a black box, and a black box is what every
 * other site offers.
 */
export function SignalList({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Nothing notable is active in this window. That happens, and it is more
        honest to say so than to find something.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {signals.map((signal, i) => (
        <li key={`${signal.code}-${i}`} className="surface-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span
              className="text-[0.65rem] uppercase tracking-[0.16em]"
              style={{ color: TONE_COLOR[signal.tone] }}
            >
              {KIND_LABEL[signal.kind]}
            </span>
            <Weight value={signal.weight} />
          </div>

          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {signal.statement}
          </p>

          <p
            className="mt-2 border-l pl-3 text-xs leading-relaxed"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
          >
            {signal.rule}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Five pips, because weight is the reason one finding leads and another does not. */
function Weight({ value }: { value: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" title={`Weight ${value} of 5`}>
      <span className="sr-only">Weight {value} of 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden
          className="block h-1 w-1 rounded-full"
          style={{
            background: n <= value ? 'var(--color-gold-400)' : 'var(--border-strong)',
          }}
        />
      ))}
    </span>
  );
}
