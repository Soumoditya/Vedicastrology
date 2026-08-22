import type { Graha } from '@/lib/astro/constants';

import { GrahaSphereBody, GrahaSphereDefs } from './GrahaMark';

/**
 * The navagraha, turning.
 *
 * Sun at the still centre, the other eight riding concentric rings at their own
 * rates. Every ring is one CSS animation on `transform` — no state, no
 * `requestAnimationFrame`, no `filter` anywhere in or above it — so this is a
 * server component that hydrates to nothing and costs the compositor a handful
 * of rotating layers.
 *
 * The periods are ordered truthfully and scaled honestly, which is worth a
 * sentence because it would have been easier to pick nine round numbers. Real
 * sidereal periods span a factor of four hundred between the Moon and Saturn:
 * at any speed where the Moon is pleasant to watch, Saturn would not
 * perceptibly move, and at any speed where Saturn moves, the Moon is a blur.
 * So the ratios are compressed by a power of about 0.42 — which preserves the
 * *ordering* exactly, keeps Saturn visibly the slowest thing on screen, and
 * still lets the Moon come round while somebody is reading the verse beside it.
 *
 * Rahu and Ketu turn the other way, because they do, and sit opposite each
 * other on one radius, because they are always exactly six signs apart.
 */

interface Ring {
  graha: Graha;
  /** Distance from centre in the 400×400 field. */
  radius: number;
  /** Seconds for one revolution. */
  period: number;
  /** Sphere diameter in the field. */
  size: number;
  /** Rahu and Ketu only. */
  retrograde?: boolean;
  /** Degrees offset along the ring, so nothing starts in a row. */
  phase: number;
}

const RINGS: Ring[] = [
  { graha: 'Moon', radius: 62, period: 12, size: 26, phase: 20 },
  { graha: 'Mercury', radius: 88, period: 19, size: 22, phase: 145 },
  { graha: 'Venus', radius: 112, period: 29, size: 27, phase: 260 },
  { graha: 'Mars', radius: 136, period: 46, size: 24, phase: 75 },
  { graha: 'Jupiter', radius: 160, period: 100, size: 34, phase: 200 },
  { graha: 'Saturn', radius: 184, period: 146, size: 32, phase: 310 },
  { graha: 'Rahu', radius: 208, period: 121, size: 22, phase: 0, retrograde: true },
  { graha: 'Ketu', radius: 208, period: 121, size: 22, phase: 180, retrograde: true },
];

export function NavagrahaOrbit({
  size = 380,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 440 440"
      className={className}
      aria-hidden
    >
      {/*
        All nine gradient sets in one `<defs>`, rather than nine nested
        documents. The `orbit` namespace keeps these clear of the standalone
        marks on the remedies and gemstone pages.
      */}
      <GrahaSphereDefs graha="Sun" ns="orbit" />
      {RINGS.map((r) => (
        <GrahaSphereDefs key={`def-${r.graha}`} graha={r.graha} ns="orbit" />
      ))}

      <g transform="translate(20 20)">
        {/* The paths themselves, drawn once and still. */}
        <g fill="none" stroke="var(--color-gold-500)" opacity="0.13">
          {RINGS.map((r) => (
            <circle key={`path-${r.graha}`} cx="200" cy="200" r={r.radius} strokeWidth="0.7" />
          ))}
        </g>

        {RINGS.map((r) => (
          <g
            key={r.graha}
            className="orbit-ring"
            data-retrograde={r.retrograde ? 'true' : undefined}
            style={{ ['--period' as string]: `${r.period}s` }}
          >
            {/*
              No counter-rotation on these.

              A lit sphere has no top, so it can ride its ring at any angle and
              look identical — which means it needs neither a second animated
              layer nor a `transform-origin` that has to be got exactly right.
              The Devanagari initials, which *would* have tumbled, live on the
              static marks in the remedies and gemstone lists instead, where
              they are set at a size somebody can actually read rather than at
              twenty-odd pixels inside a turning figure.
            */}
            {/* Phase turns the graha to its starting place; the translate
                carries it out to its radius; the scale sizes the sphere, whose
                own field is 100 units centred on (50,50) — hence the last
                translate, which puts that centre on the ring rather than its
                corner. */}
            <g transform={`rotate(${r.phase} 200 200)`}>
              <g transform={`translate(200 ${200 - r.radius}) scale(${r.size / 100})`}>
                <g transform="translate(-50 -50)">
                  <GrahaSphereBody graha={r.graha} ns="orbit" showInitial={false} />
                </g>
              </g>
            </g>
          </g>
        ))}

        {/* Sūrya, at the centre, still. Everything is measured from here. */}
        <g transform="translate(200 200) scale(0.62) translate(-50 -50)">
          <GrahaSphereBody graha="Sun" ns="orbit" />
        </g>
      </g>
    </svg>
  );
}
