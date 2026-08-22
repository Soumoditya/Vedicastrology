'use client';

import { useEffect, useMemo, useRef } from 'react';
import { svgCoord } from '@/lib/svg-coord';

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
 *
 * How the motion is split, which is the part that was wrong.
 *
 * The ring drift and the pointer tilt were both driven from one
 * `requestAnimationFrame` loop that never stopped — writing `style.transform`
 * into three groups every frame, forever, on a page that is usually sitting
 * still. Worse, the root `<svg>` carried a `drop-shadow`, so every one of those
 * frames re-rasterised the whole 400x400 figure through a 30px blur. That is
 * the single most expensive thing the site was doing, and it was doing it to
 * rotate two circles at a constant rate.
 *
 * Now: the rings are CSS `@keyframes`, which is what constant-rate rotation is
 * for and costs the compositor nothing. The glow is a still radial gradient
 * behind the figure rather than a filter above it. Only the tilt still needs
 * JavaScript, because it follows a pointer, and its loop starts on movement and
 * stops itself once the figure has settled.
 */
export function HeroYantra() {
  const root = useRef<SVGSVGElement>(null);
  const fast = useRef<SVGGElement>(null);

  const nakshatras = useMemo(() => Array.from({ length: 27 }, (_, i) => (i * 360) / 27), []);
  const rashis = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 30), []);
  const petals = useMemo(() => Array.from({ length: 8 }, (_, i) => i * 45), []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /*
      Only the tilt is driven from here now.

      The two ring rotations moved to CSS, where a constant-rate spin belongs:
      they were the reason this loop ran for the lifetime of the page, and a
      `@keyframes rotate` costs the compositor nothing per frame where a
      `style.transform` write costs a full style recalculation.

      What is left genuinely needs input, so it still eases toward the pointer —
      but the loop starts on pointer movement and stops itself once the figure
      has settled, instead of turning forever behind a static page.
    */
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const frame = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;

      if (fast.current) {
        fast.current.style.transform = `translate(${curX * 11}px, ${curY * 11}px)`;
      }

      // Settled: within a tenth of a pixel of the target, so stop rather than
      // keep chasing a difference nobody can see.
      const settled = Math.abs(targetX - curX) < 0.001 && Math.abs(targetY - curY) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(frame);
    };

    const onPointer = (event: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      // -1 to 1 across the figure, clamped, so a pointer far away still reads.
      targetX = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      if (!raf) raf = requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const groupStyle = { transformBox: 'fill-box', transformOrigin: 'center' } as const;

  return (
    <svg
      ref={root}
      viewBox="0 0 400 400"
      className="ink-draw in h-auto w-full"
      style={{ ['--draw-length' as string]: '1400' }}
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
        <radialGradient id="hero-halo" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="var(--color-gold-500)" stopOpacity="0.22" />
          <stop offset="88%" stopColor="var(--color-gold-500)" stopOpacity="0.09" />
          <stop offset="100%" stopColor="var(--color-gold-500)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/*
        The glow, as a gradient rather than a `drop-shadow` filter.

        The filter used to sit on the root `<svg>` — above every animated group
        in it — so each frame of the ring rotation re-rasterised the whole
        400x400 figure through a 30px blur. This gives the same halo, is painted
        once, and never re-rasterises because it does not move.
      */}
      <circle cx="200" cy="200" r="196" fill="url(#hero-halo)" stroke="none" />
      <circle cx="200" cy="200" r="150" fill="url(#hero-core)" stroke="none" />

      <g stroke="url(#hero-gold)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer, slow-turning ring with the twenty-seven nakshatra ticks. */}
        <g className="yantra-ring" style={{ ['--period' as string]: '300s' }}>
          <circle cx="200" cy="200" r="178" strokeWidth="0.6" opacity="0.35" />
          <circle cx="200" cy="200" r="168" strokeWidth="1" opacity="0.7" />
          <g opacity="0.45" strokeWidth="0.7">
            {nakshatras.map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              return (
                <line
                  key={`n-${deg}`}
                  x1={svgCoord(200 + Math.cos(a) * 168)}
                  y1={svgCoord(200 + Math.sin(a) * 168)}
                  x2={svgCoord(200 + Math.cos(a) * 178)}
                  y2={svgCoord(200 + Math.sin(a) * 178)}
                />
              );
            })}
          </g>
        </g>

        {/* Middle ring: the twelve rashi divisions, turning the other way. */}
        <g className="yantra-ring" data-reverse="true" style={{ ['--period' as string]: '750s' }}>
          <circle cx="200" cy="200" r="132" strokeWidth="0.8" opacity="0.55" />
          <g opacity="0.6" strokeWidth="0.8">
            {rashis.map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              return (
                <line
                  key={`r-${deg}`}
                  x1={svgCoord(200 + Math.cos(a) * 132)}
                  y1={svgCoord(200 + Math.sin(a) * 132)}
                  x2={svgCoord(200 + Math.cos(a) * 168)}
                  y2={svgCoord(200 + Math.sin(a) * 168)}
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
              const cx = svgCoord(200 + Math.cos(a) * 62);
              const cy = svgCoord(200 + Math.sin(a) * 62);
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
