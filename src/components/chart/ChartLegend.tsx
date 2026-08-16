'use client';

import { useState } from 'react';

/**
 * Key to the chart.
 *
 * Everything drawn in the chart uses a convention that is obvious to an
 * astrologer and completely opaque to everybody else. The retrograde mark is
 * the worst offender: nobody who does not already know what it means will
 * guess. This spells all of it out without cluttering the chart itself.
 */
export function ChartLegend({ style = 'north-indian' }: { style?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <Key swatch="var(--color-benefic)">Benefic for this chart</Key>
        <Key swatch="var(--color-malefic)">Malefic for this chart</Key>
        <Key swatch="var(--color-graha-neutral)">Neutral</Key>

        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span
            className="font-medium"
            style={{ color: 'var(--color-saffron-300)' }}
            aria-hidden
          >
            ℞
          </span>
          Retrograde, moving backward
        </span>

        <span style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--color-gold-400)' }}>1 to 12</span> are
          rashis, not houses
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 text-xs underline underline-offset-4"
        style={{ color: 'var(--color-gold-400)' }}
      >
        {open ? 'Hide' : 'How do I read this chart?'}
      </button>

      {open && (
        <div
          className="mt-3 space-y-3 rounded-lg border p-4 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
          }}
        >
          {style === 'north-indian' ? (
            <>
              <p>
                The houses never move. The diamond at the top is always the
                first house, and the count runs anticlockwise from there. This
                is the opposite of the South Indian style, where the signs stay
                put and the houses move.
              </p>
              <p>
                The number written in each house is the rashi sitting in it. 1
                is Aries and 12 is Pisces. So if the top diamond holds a 7, your
                ascendant is Libra.
              </p>
            </>
          ) : (
            <p>
              The signs never move. Aries is always the second box on the top
              row and the order runs clockwise. The house numbers shift
              depending on where your ascendant falls.
            </p>
          )}
          <p>
            The two letter labels are the grahas. Su is the Sun, Mo the Moon, Ma
            Mars, Me Mercury, Ju Jupiter, Ve Venus, Sa Saturn, Ra Rahu and Ke
            Ketu. The small number beside each one is its degree within that
            sign.
          </p>
          <p>
            Colour shows how a graha behaves for your ascendant specifically,
            which is not the same as whether it is naturally benefic. A natural
            malefic ruling a good house can be the best graha in your chart.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            In a crowded house the degrees are hidden and the labels move to two
            columns so nothing spills outside the chart.
          </p>
        </div>
      )}
    </div>
  );
}

function Key({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ background: swatch }}
      />
      {children}
    </span>
  );
}
