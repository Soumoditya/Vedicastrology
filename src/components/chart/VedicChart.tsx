'use client';

import { useId, useMemo, useState } from 'react';

import {
  NORTH_INDIAN,
  polygonToPoints,
  southIndianGeometry,
  type ChartGeometry,
  type ChartRenderData,
  type RenderGraha,
} from '@/lib/chart-render/geometry';
import { RASHI_NAMES_EN, RASHI_SYMBOLS } from '@/lib/astro/constants';

export type ChartStyle = 'north-indian' | 'south-indian';

export interface VedicChartProps {
  data: ChartRenderData;
  style?: ChartStyle;
  /** Draw degrees beside each graha. Turned off for divisional charts. */
  showDegrees?: boolean;
  /** Play the stroke-draw animation when the chart first appears. */
  animate?: boolean;
  /** Notified when a house is selected, for the detail panel. */
  onSelectHouse?: (house: number | null) => void;
  selectedHouse?: number | null;
  className?: string;
}

/** Colour of a graha label, by functional nature. */
function grahaColor(g: RenderGraha): string {
  if (g.nature === 'benefic') return 'var(--color-benefic)';
  if (g.nature === 'malefic') return 'var(--color-malefic)';
  return 'var(--color-graha-neutral)';
}

/**
 * The chart drawing.
 *
 * Everything is plain SVG in a 100×100 viewBox, so it scales to any size
 * without loss and prints cleanly. Geometry comes from a pluggable definition,
 * which is what lets the same component draw both the North and South Indian
 * styles and every divisional chart.
 */
export function VedicChart({
  data,
  style = 'north-indian',
  showDegrees = true,
  animate = true,
  onSelectHouse,
  selectedHouse = null,
  className = '',
}: VedicChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');

  const geometry: ChartGeometry = useMemo(
    () =>
      style === 'south-indian'
        ? southIndianGeometry(data.ascendantRashi)
        : NORTH_INDIAN,
    [style, data.ascendantRashi],
  );

  const houseByNumber = useMemo(() => {
    const map = new Map<number, ChartRenderData['houses'][number]>();
    for (const h of data.houses) map.set(h.house, h);
    return map;
  }, [data.houses]);

  const active = hovered ?? selectedHouse;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="-3 -3 106 106"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={
          data.title
            ? `${data.title} chart, ascendant in ${RASHI_NAMES_EN[data.ascendantRashi]}`
            : `Vedic chart, ascendant in ${RASHI_NAMES_EN[data.ascendantRashi]}`
        }
      >
        <defs>
          {/*
            Gold leaf gradient for the frame.

            `userSpaceOnUse` is required, not stylistic. With the default
            `objectBoundingBox` units, an element whose bounding box has zero
            width or height is not painted at all — and the four sides of the
            outer square are axis-aligned, so they are exactly that. Using
            object bounding box units silently erases the square while leaving
            the diagonals visible.
          */}
          <linearGradient
            id={`${uid}-gold`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="100"
            y2="100"
          >
            <stop offset="0%" stopColor="var(--color-gold-200)" />
            <stop offset="40%" stopColor="var(--color-gold-500)" />
            <stop offset="70%" stopColor="var(--color-gold-600)" />
            <stop offset="100%" stopColor="var(--color-gold-300)" />
          </linearGradient>

          {/* Subtle inner glow behind the whole figure. */}
          <radialGradient id={`${uid}-aura`} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-gold-500)"
              stopOpacity="0.10"
            />
            <stop offset="100%" stopColor="var(--color-gold-500)" stopOpacity="0" />
          </radialGradient>

          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="-3" y="-3" width="106" height="106" fill={`url(#${uid}-aura)`} />

        {/* Cell fills sit beneath the frame so the gold lines stay crisp. */}
        <g>
          {geometry.cells.map((cell) => {
            const isActive = active === cell.house;
            return (
              <polygon
                key={`fill-${cell.house}`}
                points={polygonToPoints(cell.polygon)}
                fill={
                  isActive
                    ? 'color-mix(in oklab, var(--color-gold-500) 14%, transparent)'
                    : 'transparent'
                }
                className="transition-[fill] duration-300"
                style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
              />
            );
          })}
        </g>

        {/* The frame itself. */}
        <g
          stroke={`url(#${uid}-gold)`}
          strokeWidth="0.5"
          strokeLinecap="round"
          fill="none"
        >
          {geometry.frame.map((line, i) => (
            <line
              key={i}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              className={animate ? 'draw-stroke' : undefined}
              style={
                animate
                  ? ({
                      '--dash-length': 160,
                      animationDelay: `${i * 55}ms`,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          ))}
        </g>

        {/* Cell contents. */}
        <g>
          {geometry.cells.map((cell) => {
            const house = houseByNumber.get(cell.house);
            if (!house) return null;

            const isAscendant = cell.house === 1;
            const grahas = house.grahas;

            // Crowded houses drop the degree and tighten the leading rather
            // than spilling outside the cell.
            const crowded = grahas.length > cell.capacity;
            const lineHeight = crowded ? 4.2 : 5.2;
            const startY =
              cell.contentAt.y - ((grahas.length - 1) * lineHeight) / 2;

            return (
              <g key={`content-${cell.house}`}>
                {/* Rashi numeral — the sign occupying this house. */}
                <text
                  x={cell.numberAt.x}
                  y={cell.numberAt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="4.6"
                  fill={
                    isAscendant ? 'var(--color-gold-200)' : 'var(--color-gold-500)'
                  }
                  fontWeight={isAscendant ? 600 : 400}
                  opacity={isAscendant ? 1 : 0.75}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {house.rashi + 1}
                </text>

                {/* Grahas. */}
                {grahas.map((g, i) => {
                  const y = startY + i * lineHeight;
                  return (
                    <text
                      key={g.graha}
                      x={cell.contentAt.x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={crowded ? '3.5' : '4'}
                      fill={grahaColor(g)}
                      fontWeight={500}
                      style={{
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {g.abbr}
                      {g.retrograde && (
                        <tspan fontSize="2.6" dy="-1.2" opacity="0.85">
                          ℞
                        </tspan>
                      )}
                      {showDegrees && !crowded && g.degree !== undefined && (
                        <tspan
                          fontSize="2.7"
                          dy={g.retrograde ? '1.2' : '0'}
                          dx="0.6"
                          opacity="0.6"
                        >
                          {Math.floor(g.degree)}°
                        </tspan>
                      )}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Ascendant marker — a small gold tick on the first house. */}
        {style === 'north-indian' && (
          <g opacity="0.9" filter={`url(#${uid}-soft)`}>
            <path
              d="M 50 2.5 L 52 6 L 48 6 Z"
              fill="var(--color-gold-300)"
            />
          </g>
        )}

        {/* Hit areas last, so they sit above everything and stay clickable. */}
        <g>
          {geometry.cells.map((cell) => {
            const house = houseByNumber.get(cell.house);
            return (
              <polygon
                key={`hit-${cell.house}`}
                points={polygonToPoints(cell.polygon)}
                fill="transparent"
                className="cursor-pointer outline-none"
                tabIndex={0}
                role="button"
                aria-label={
                  house
                    ? `House ${cell.house}, ${RASHI_NAMES_EN[house.rashi]}` +
                      (house.grahas.length
                        ? `, containing ${house.grahas.map((g) => g.graha).join(', ')}`
                        : ', empty')
                    : `House ${cell.house}`
                }
                onMouseEnter={() => setHovered(cell.house)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(cell.house)}
                onBlur={() => setHovered(null)}
                onClick={() =>
                  onSelectHouse?.(selectedHouse === cell.house ? null : cell.house)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectHouse?.(
                      selectedHouse === cell.house ? null : cell.house,
                    );
                  }
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Sign legend for the hovered house, so the numerals stay readable to
          someone who does not know them by heart. */}
      {active !== null && houseByNumber.has(active) && (
        <div
          className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full
                     whitespace-nowrap rounded-full border px-3 py-1 text-xs"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--color-gold-300)' }}>
            House {active}
          </span>
          {' · '}
          {RASHI_SYMBOLS[houseByNumber.get(active)!.rashi]}{' '}
          {RASHI_NAMES_EN[houseByNumber.get(active)!.rashi]}
        </div>
      )}
    </div>
  );
}
