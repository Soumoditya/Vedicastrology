import type { Graha } from '@/lib/astro/constants';

/**
 * The nine grahas, drawn as lit spheres.
 *
 * "Three-dimensional and realistic" without a three-dimensional renderer, which
 * is the whole trick here. three.js or a WebGL canvas would ship a large
 * dependency and hand a tired GPU a per-frame workload, to draw nine circles —
 * on a machine where the last round of work was spent taking per-frame workload
 * *away*.
 *
 * A lit sphere is flat geometry: a radial gradient whose centre is pushed
 * toward the light, a darker limb where the surface turns away, and a small
 * specular highlight. That reads as a ball, scales to any size without loss,
 * prints, and costs the compositor exactly what a plain filled circle costs.
 *
 * Two things are deliberately absent. There is **no `filter`** anywhere in
 * here: the Sun's corona is a second gradient rather than a blur, because a
 * filter on an element that moves re-rasterises it every frame, and these
 * spheres are used inside `NavagrahaOrbit` where they do move. And the spheres
 * do not spin on their own axis, because that needs a texture and SVG has no
 * cheap way to map one — the solidity comes from the shading, not from motion.
 *
 * Colours are the classical graha colours, which happens to be convenient:
 * they are also roughly what the bodies look like, so tradition and realism
 * agree and nothing has to be fudged.
 */

interface Body {
  /** Devanagari initial, as a printed kundli abbreviates it. */
  initial: string;
  /** Lit face. */
  light: string;
  /** Body colour at the terminator. */
  dark: string;
  /** Ink for the initial, chosen for contrast against `light`. */
  ink: string;
}

export const GRAHA_BODY: Record<Graha, Body> = {
  Sun: { initial: 'सू', light: '#ffd98a', dark: '#b45a09', ink: '#4a2600' },
  Moon: { initial: 'चं', light: '#f6f4ee', dark: '#8e9198', ink: '#33363d' },
  Mars: { initial: 'मं', light: '#ef8a63', dark: '#8c2b16', ink: '#3d0e05' },
  Mercury: { initial: 'बु', light: '#8fdcae', dark: '#1d6b45', ink: '#042c19' },
  Jupiter: { initial: 'गु', light: '#f7cf7d', dark: '#a3701a', ink: '#432c02' },
  Venus: { initial: 'शु', light: '#fdf3dd', dark: '#b39b6b', ink: '#403524' },
  Saturn: { initial: 'श', light: '#8fa2d6', dark: '#2b3566', ink: '#0b1030' },
  Rahu: { initial: 'रा', light: '#9d9aa6', dark: '#33303c', ink: '#e8e6ee' },
  Ketu: { initial: 'के', light: '#c3bcae', dark: '#544d43', ink: '#221e18' },
};

export interface GrahaMarkProps {
  graha: Graha;
  /** Rendered width and height, in px. */
  size?: number;
  /**
   * Namespace for the gradient ids.
   *
   * SVG gradient ids are document-global, so two of these on one page with the
   * same graha would collide and the second would silently borrow the first's
   * fill. Each graha appears once per page in practice, but the orbit and a
   * list of marks can coexist, so callers that mix them pass a namespace.
   */
  ns?: string;
  className?: string;
  /** Set when the mark is decorative and the graha is named in adjacent text. */
  decorative?: boolean;
}

/** A single sphere, as its own `<svg>`. For lists and table rows. */
export function GrahaMark({
  graha,
  size = 28,
  ns = 'gm',
  className,
  decorative = false,
}: GrahaMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : graha}
    >
      <GrahaSphereDefs graha={graha} ns={ns} />
      <GrahaSphereBody graha={graha} ns={ns} />
    </svg>
  );
}

/**
 * The gradients for one graha.
 *
 * Split from the body so `NavagrahaOrbit` can collect all nine sets into a
 * single `<defs>` at the top of one `<svg>`, rather than nesting nine documents.
 */
export function GrahaSphereDefs({ graha, ns = 'gm' }: { graha: Graha; ns?: string }) {
  const b = GRAHA_BODY[graha];
  return (
    <defs>
      {/*
        Light from the upper left. Offsetting the gradient centre — rather than
        centring it — is the entire difference between a disc and a ball.
      */}
      <radialGradient id={`${ns}-${graha}-body`} cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor={b.light} />
        <stop offset="55%" stopColor={b.light} stopOpacity="0.85" />
        <stop offset="100%" stopColor={b.dark} />
      </radialGradient>

      {/* The far limb, turning away from the light. */}
      <radialGradient id={`${ns}-${graha}-limb`} cx="35%" cy="30%" r="78%">
        <stop offset="70%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
      </radialGradient>

      {/* Specular highlight, small and offset. */}
      <radialGradient id={`${ns}-${graha}-spec`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>

      {/* The Sun's corona. A gradient, never a blur — see the note above. */}
      {graha === 'Sun' && (
        <radialGradient id={`${ns}-Sun-corona`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#ffb347" stopOpacity="0.5" />
          <stop offset="80%" stopColor="#ff9500" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ff9500" stopOpacity="0" />
        </radialGradient>
      )}
    </defs>
  );
}

/** The sphere itself, drawn in a 100×100 field centred on (50,50). */
export function GrahaSphereBody({
  graha,
  ns = 'gm',
  showInitial = true,
}: {
  graha: Graha;
  ns?: string;
  showInitial?: boolean;
}) {
  const b = GRAHA_BODY[graha];

  return (
    <g>
      {graha === 'Sun' && <circle cx="50" cy="50" r="50" fill={`url(#${ns}-Sun-corona)`} />}

      {/* Saturn's ring, behind the body then in front of it, so the planet
          sits inside it rather than on top of it. */}
      {graha === 'Saturn' && (
        <ellipse
          cx="50"
          cy="50"
          rx="46"
          ry="13"
          fill="none"
          stroke={b.light}
          strokeWidth="3"
          opacity="0.55"
          transform="rotate(-18 50 50)"
        />
      )}

      <circle cx="50" cy="50" r="34" fill={`url(#${ns}-${graha}-body)`} />
      <circle cx="50" cy="50" r="34" fill={`url(#${ns}-${graha}-limb)`} />

      {/* Jupiter's bands, clipped to the disc by simply being short arcs. */}
      {graha === 'Jupiter' && (
        <g opacity="0.28" stroke={b.dark} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M22 42 Q50 37 78 42" />
          <path d="M24 58 Q50 63 76 58" />
        </g>
      )}

      {/* Ketu is a tail without a head; the fade says so without an illustration. */}
      {graha === 'Ketu' && (
        <path
          d="M62 62 Q84 74 92 92"
          fill="none"
          stroke={b.light}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
      )}

      {/* Rahu takes light rather than giving it, so it gets no highlight. */}
      {graha !== 'Rahu' && (
        <ellipse cx="37" cy="34" rx="11" ry="8" fill={`url(#${ns}-${graha}-spec)`} transform="rotate(-25 37 34)" />
      )}

      <circle
        cx="50"
        cy="50"
        r="34"
        fill="none"
        stroke="var(--color-gold-500)"
        strokeWidth="1.4"
        opacity="0.55"
      />

      {showInitial && (
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="26"
          fontWeight={600}
          fill={b.ink}
          style={{ fontFamily: 'var(--font-devanagari), serif' }}
        >
          {b.initial}
        </text>
      )}
    </g>
  );
}
