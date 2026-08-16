'use client';

import { useEffect, useMemo, useRef } from 'react';

/**
 * The hero figure, rebuilt.
 *
 * The old yantra was a flat geometric mandala that sat there, which was the
 * "no personality, AI slop" complaint. This one is alive: its rings drift
 * slowly on their own, the whole figure tilts toward the pointer in layers so
 * it reads as a lit object with depth, its strokes draw themselves in on load,
 * and the Om sits at the still centre where a generic bindu used to be. That
 * last part is the identity, a real mark rather than a dot.
 *
 * It is still deliberately not a fabricated chart. Presenting invented
 * placements as if they were someone's reading would betray the whole pitch, so
 * this stays a figure in the chart's visual language, twelve rashi divisions,
 * the nakshatra ring, the interlocking shatkona, and the North Indian diamond.
 *
 * All motion yields to prefers-reduced-motion: no drift, no tilt, no draw, just
 * the finished figure.
 */
export function HeroYantra() {
  const root = useRef<SVGSVGElement>(null);
  const slow = useRef<SVGGElement>(null);
  const mid = useRef<SVGGElement>(null);
  const fast = useRef<SVGGElement>(null);

  const nakshatras = useMemo(() => Array.from({ length: 27 }, (_, i) => (i * 360) / 27), []);
  const rashis = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 30), []);
  const petals = useMemo(() => Array.from({ length: 8 }, (_, i) => i * 45), []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let spin = 0;
    // Pointer position, smoothed toward, so the tilt eases rather than snaps.
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onPointer = (event: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      // -1 to 1 across the figure, clamped, so a pointer far away still reads.
      targetX = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };

    const frame = () => {
      spin = (spin + 0.03) % 360;
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;

      // The outer ring turns on its own; every layer also shifts a little with
      // the pointer, the fast layer most, so parallax gives the figure depth.
      if (slow.current) slow.current.style.transform = `rotate(${spin}deg) translate(${curX * 3}px, ${curY * 3}px)`;
      if (mid.current) mid.current.style.transform = `rotate(${-spin * 0.4}deg) translate(${curX * 6}px, ${curY * 6}px)`;
      if (fast.current) fast.current.style.transform = `translate(${curX * 11}px, ${curY * 11}px)`;

      raf = requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('pointermove', onPointer);
      cancelAnimationFrame(raf);
    };
  }, []);

  const groupStyle = { transformBox: 'fill-box', transformOrigin: 'center' } as const;

  return (
    <svg
      ref={root}
      viewBox="0 0 400 400"
      className="ink-draw in h-auto w-full"
      style={{
        filter: 'drop-shadow(0 0 30px color-mix(in oklab, var(--color-gold-500) 26%, transparent))',
        ['--draw-length' as string]: '1400',
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-200)" />
          <stop offset="50%" stopColor="var(--color-gold-500)" />
          <stop offset="100%" stopColor="var(--color-gold-700)" />
        </linearGradient>
        <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-gold-300)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-gold-500)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="150" fill="url(#hero-core)" stroke="none" />

      <g stroke="url(#hero-gold)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer, slow-turning ring with the twenty-seven nakshatra ticks. */}
        <g ref={slow} style={groupStyle}>
          <circle cx="200" cy="200" r="178" strokeWidth="0.6" opacity="0.35" />
          <circle cx="200" cy="200" r="168" strokeWidth="1" opacity="0.7" />
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
        </g>

        {/* Middle ring: the twelve rashi divisions, turning the other way. */}
        <g ref={mid} style={groupStyle}>
          <circle cx="200" cy="200" r="132" strokeWidth="0.8" opacity="0.55" />
          <g opacity="0.6" strokeWidth="0.8">
            {rashis.map((deg) => {
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
        </g>

        {/* Foreground, most responsive to the pointer. */}
        <g ref={fast} style={groupStyle}>
          {/* The shatkona, two interlocking triangles. */}
          <g strokeWidth="1" opacity="0.85">
            <path d="M200 118 L271 241 L129 241 Z" />
            <path d="M200 282 L129 159 L271 159 Z" />
          </g>

          {/* The North Indian diamond, quietly echoing the chart style. */}
          <g strokeWidth="0.9" opacity="0.7">
            <rect x="139" y="139" width="122" height="122" />
            <path d="M139 139 L261 261 M261 139 L139 261" />
            <path d="M200 139 L139 200 L200 261 L261 200 Z" />
          </g>

          {/* Lotus petals around the core. */}
          <g strokeWidth="0.7" opacity="0.5">
            {petals.map((deg) => {
              const a = (deg * Math.PI) / 180;
              const cx = 200 + Math.cos(a) * 62;
              const cy = 200 + Math.sin(a) * 62;
              return <circle key={`p-${deg}`} cx={cx} cy={cy} r="22" />;
            })}
          </g>

          <circle cx="200" cy="200" r="34" strokeWidth="1" />
        </g>
      </g>

      {/* A small dark disc so the Om reads cleanly against the geometry behind
          it, then the Om itself at the still centre. A real mark, where a plain
          bindu used to be. */}
      <circle cx="200" cy="200" r="30" fill="var(--surface)" opacity="0.85" stroke="none" />
      <text
        x="200"
        y="207"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="46"
        fontWeight={600}
        fill="var(--color-gold-200)"
        stroke="none"
        style={{ fontFamily: 'var(--font-devanagari), serif' }}
      >
        ॐ
      </text>
    </svg>
  );
}
