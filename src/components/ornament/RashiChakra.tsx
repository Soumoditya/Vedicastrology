import { RASHI_SYMBOLS } from '@/lib/astro/constants';

/**
 * The twelve signs, as a slowly turning disc.
 *
 * A second figure rather than the orbit again. One motif repeated around a site
 * stops reading as ornament and starts reading as wallpaper, and these two say
 * different things: the orbit is the grahas moving through time, this is the
 * fixed frame they move against. Which is also why it turns as one piece — the
 * rashis do not move relative to each other, and a chakra whose segments drifted
 * apart would be drawing a lie.
 *
 * Same rules as the orbit: one CSS `transform` animation, no filter, no state,
 * no client bundle. The whole disc is a single `--period`, so it costs one
 * composited layer rather than twelve.
 */
export function RashiChakra({
  size = 240,
  /** Seconds for one revolution. Slow: this is a background, not an event. */
  period = 240,
  className,
}: {
  size?: number;
  period?: number;
  className?: string;
}) {
  const R_OUTER = 96;
  const R_INNER = 66;
  const R_MARK = 81;

  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
    >
      <g
        className="orbit-ring"
        style={{ ['--period' as string]: `${period}s` }}
      >
        <g fill="none" stroke="var(--color-gold-500)" strokeLinecap="round">
          <circle cx="100" cy="100" r={R_OUTER} strokeWidth="0.8" opacity="0.45" />
          <circle cx="100" cy="100" r={R_INNER} strokeWidth="0.8" opacity="0.35" />
          <circle cx="100" cy="100" r={R_OUTER - 5} strokeWidth="0.5" opacity="0.2" />

          {/* The twelve divisions. */}
          <g strokeWidth="0.7" opacity="0.3">
            {spokes.map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              return (
                <line
                  key={`spoke-${deg}`}
                  x1={(100 + Math.cos(a) * R_INNER).toFixed(2)}
                  y1={(100 + Math.sin(a) * R_INNER).toFixed(2)}
                  x2={(100 + Math.cos(a) * R_OUTER).toFixed(2)}
                  y2={(100 + Math.sin(a) * R_OUTER).toFixed(2)}
                />
              );
            })}
          </g>
        </g>

        {/*
          The signs. Each counter-rotates against the disc so it stays the right
          way up all the way round — a chakra whose labels turn upside down at
          the bottom is a mobile, not a chart.
        */}
        {spokes.map((deg, i) => {
          const a = ((deg + 15 - 90) * Math.PI) / 180;
          const x = 100 + Math.cos(a) * R_MARK;
          const y = 100 + Math.sin(a) * R_MARK;
          return (
            <g
              key={`mark-${deg}`}
              className="orbit-mark"
              /*
                The origin is this sign's own position, given in viewBox units.
                Anything vaguer — `center` against a fill-box — resolves against
                a reference box that is not the point you meant once the group
                sits inside a transform chain, and the marks end up orbiting a
                spot outside the figure.
              */
              style={{
                ['--period' as string]: `${period}s`,
                transformOrigin: `${x.toFixed(2)}px ${y.toFixed(2)}px`,
              }}
            >
              <text
                x={x.toFixed(2)}
                y={y.toFixed(2)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fill="var(--color-gold-300)"
                opacity="0.85"
              >
                {RASHI_SYMBOLS[i]}
              </text>
            </g>
          );
        })}
      </g>

      {/* A still centre, so the eye has somewhere to rest while the rim turns. */}
      <circle
        cx="100"
        cy="100"
        r="26"
        fill="none"
        stroke="var(--color-gold-500)"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <text
        x="100"
        y="102"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fill="var(--color-gold-400)"
        opacity="0.75"
        style={{ fontFamily: 'var(--font-devanagari), serif' }}
      >
        ॐ
      </text>
    </svg>
  );
}
