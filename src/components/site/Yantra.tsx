'use client';

/**
 * A drawn yantra for the hero.
 *
 * Deliberately *not* a real chart, presenting a fabricated chart as if it were
 * someone's would be dishonest, and a generic one would say nothing. This is a
 * geometric figure in the same visual language: twelve rashi divisions, the
 * nakshatra ring, and the interlocking triangles found in classical yantras.
 *
 * Everything is stroke-drawn on mount and then still. No loop, because a hero
 * that keeps moving competes with the text next to it.
 */
export function Yantra() {
  const rings = Array.from({ length: 12 }, (_, i) => i * 30);
  const nakshatras = Array.from({ length: 27 }, (_, i) => (i * 360) / 27);

  return (
    <svg
      viewBox="0 0 400 400"
      className="h-auto w-full"
      aria-hidden
      style={{ filter: 'drop-shadow(0 0 26px color-mix(in oklab, var(--color-gold-500) 22%, transparent))' }}
    >
      <defs>
        <linearGradient id="yantra-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-200)" />
          <stop offset="50%" stopColor="var(--color-gold-500)" />
          <stop offset="100%" stopColor="var(--color-gold-700)" />
        </linearGradient>
        <radialGradient id="yantra-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-gold-300)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-gold-500)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="150" fill="url(#yantra-core)" />

      <g
        stroke="url(#yantra-gold)"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer rings */}
        <circle cx="200" cy="200" r="178" strokeWidth="0.6" opacity="0.35" />
        <circle cx="200" cy="200" r="168" strokeWidth="1" opacity="0.7" />
        <circle cx="200" cy="200" r="132" strokeWidth="0.8" opacity="0.55" />
        <circle cx="200" cy="200" r="86" strokeWidth="0.8" opacity="0.5" />

        {/* Twenty-seven nakshatra ticks */}
        <g opacity="0.45" strokeWidth="0.7">
          {nakshatras.map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={`n-${deg}`}
                x1={200 + Math.cos(a) * 168}
                y1={200 + Math.sin(a) * 168}
                x2={200 + Math.cos(a) * 178}
                y2={200 + Math.sin(a) * 178}
              />
            );
          })}
        </g>

        {/* Twelve rashi divisions */}
        <g opacity="0.6" strokeWidth="0.8">
          {rings.map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={`r-${deg}`}
                x1={200 + Math.cos(a) * 132}
                y1={200 + Math.sin(a) * 132}
                x2={200 + Math.cos(a) * 168}
                y2={200 + Math.sin(a) * 168}
              />
            );
          })}
        </g>

        {/* Interlocking triangles */}
        <g strokeWidth="1" opacity="0.85">
          <path d="M200 118 L271 241 L129 241 Z" />
          <path d="M200 282 L129 159 L271 159 Z" />
        </g>

        {/* The North Indian diamond, quietly echoing the chart style */}
        <g strokeWidth="0.9" opacity="0.75">
          <rect x="139" y="139" width="122" height="122" />
          <path d="M139 139 L261 261 M261 139 L139 261" />
          <path d="M200 139 L139 200 L200 261 L261 200 Z" />
        </g>

        {/* Lotus petals around the core */}
        <g strokeWidth="0.7" opacity="0.5">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            const cx = 200 + Math.cos(a) * 62;
            const cy = 200 + Math.sin(a) * 62;
            return <circle key={`p-${i}`} cx={cx} cy={cy} r="22" />;
          })}
        </g>

        <circle cx="200" cy="200" r="26" strokeWidth="1" />
      </g>

      {/* Bindu, the still point at the centre */}
      <circle cx="200" cy="200" r="4" fill="var(--color-gold-200)" />
    </svg>
  );
}
