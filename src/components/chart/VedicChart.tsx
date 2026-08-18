'use client';

import { useId, useMemo, useState } from 'react';

import {
  NORTH_INDIAN,
  polygonToPoints,
  southIndianGeometry,
  type ChartGeometry,
  type ChartRenderData,
} from '@/lib/chart-render/geometry';
import { RASHI_NAMES_EN, RASHI_SYMBOLS } from '@/lib/astro/constants';
import { inscribedBox, layoutGrahas } from '@/lib/chart-render/layout';

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
        /* Room for the plate frame, which sits outside the 0-100 field. */
        viewBox="-5.5 -5.5 111 111"
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
            width or height is not painted at all, and the four sides of the
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

          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/*
          The plate.

          Paper, then a heavy outer rule, then a hairline inside it: the double
          border a printed kundli has, and the thing whose absence made this look
          weak and unfinished. Drawn slightly outside the 0–100 field so the
          frame sits around the chart rather than clipping its outermost lines.
        */}
        <rect
          x="-4"
          y="-4"
          width="108"
          height="108"
          rx="0.5"
          fill="var(--plate-paper)"
          stroke="var(--plate-ink)"
          strokeWidth="1.1"
        />
        <rect
          x="-1.6"
          y="-1.6"
          width="103.2"
          height="103.2"
          fill="none"
          stroke="var(--plate-rule)"
          strokeWidth="0.3"
          opacity="0.55"
        />

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
                    ? 'color-mix(in oklab, var(--plate-highlight) 55%, transparent)'
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
          stroke="var(--plate-rule)"
          strokeWidth="0.45"
          strokeLinecap="square"
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

            /*
              Laid out inside the cell's own shape, not around a point.

              The old version stacked labels around `contentAt` and used a
              `capacity` number to guess when to compact. A point knows nothing
              about the polygon around it, so four grahas in a corner triangle ran
              out through the diagonal into the next house — which is exactly what
              happened to the 9th in a real chart, with Moon, Jupiter, Mars and Sun
              sharing it.

              `inscribedBox` finds the largest box that actually fits the cell and
              `layoutGrahas` fills it, stepping the type down and adding columns
              only when it must. Both are pure functions in chart-render/layout so
              a test can assert containment for one to nine grahas in every cell
              of every style, which is the property that was quietly false.
            */
            const box = inscribedBox(cell.polygon);
            const layout = layoutGrahas(box, grahas.length, {
              wantDegrees: showDegrees,
            });
            const { fontSize, withDegrees } = layout;

            return (
              <g key={`content-${cell.house}`}>
                {/* Rashi numeral, the sign occupying this house. */}
                <text
                  x={cell.numberAt.x}
                  y={cell.numberAt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="4.6"
                  fill={isAscendant ? 'var(--plate-accent)' : 'var(--plate-numeral)'}
                  fontWeight={isAscendant ? 600 : 500}
                  /* Inter, not the display face: Marcellus has no lining
                     figures, so its 1 and 0 read as I and O and the rashi
                     numbers — the actual content of the chart — become
                     unreadable. */
                  style={{
                    fontFamily: 'var(--font-numeric)',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {house.rashi + 1}
                </text>

                {/* Grahas. */}
                {grahas.map((g, i) => {
                  const at = layout.positions[i];

                  return (
                    <text
                      key={g.graha}
                      x={at.x}
                      y={at.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fill="var(--plate-ink)"
                      fontWeight={500}
                      style={{
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {g.abbr}
                      {g.retrograde && (
                        <tspan
                          fontSize={fontSize * 0.65}
                          dy={-fontSize * 0.3}
                          fill="var(--plate-ink-soft)"
                        >
                          ℞
                        </tspan>
                      )}
                      {withDegrees && g.degree !== undefined && (
                        <tspan
                          fontSize={fontSize * 0.72}
                          dy={g.retrograde ? fontSize * 0.3 : 0}
                          dx="0.6"
                          fill="var(--plate-ink-soft)"
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

        {/* Ascendant marker, a small gold tick on the first house. */}
        {style === 'north-indian' && (
          <g opacity="0.9" filter={`url(#${uid}-soft)`}>
            <path d="M 50 2.5 L 52 6 L 48 6 Z" fill="var(--plate-accent)" />
          </g>
        )}

        {/*
          The South Indian ascendant marker.

          In this style the signs are fixed and the houses move, so the chart
          is unreadable without knowing which cell is the lagna. The convention
          is a diagonal drawn across that cell's top left corner, and that is
          what is drawn here rather than a tick, because a reader of South
          Indian charts is looking for the diagonal.
        */}
        {style === 'south-indian' &&
          (() => {
            const lagna = geometry.cells.find((c) => c.house === 1);
            if (!lagna) return null;

            const xs = lagna.polygon.map((p) => p.x);
            const ys = lagna.polygon.map((p) => p.y);
            const x = Math.min(...xs);
            const y = Math.min(...ys);
            const size = Math.max(...xs) - x;

            const cut = size * 0.32;

            return (
              <g>
                {/* A faint wash so the lagna cell reads at a glance, before
                    anyone has to look for the diagonal. */}
                <polygon
                  points={polygonToPoints(lagna.polygon)}
                  fill="var(--color-gold-500)"
                  opacity="0.07"
                />
                <line
                  x1={x}
                  y1={y + cut}
                  x2={x + cut}
                  y2={y}
                  stroke="var(--color-gold-300)"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* The open centre is part of this style, and leaving it blank
                    wastes the one place a South Indian chart has room to say
                    what it is. */}
                <text
                  x="50"
                  y="47"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="4.4"
                  fill="var(--color-gold-400)"
                  opacity="0.85"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {data.title ?? 'Rashi'}
                </text>
                <text
                  x="50"
                  y="54"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="3.2"
                  fill="var(--text-muted)"
                  opacity="0.8"
                >
                  {RASHI_NAMES_EN[data.ascendantRashi]} lagna
                </text>
              </g>
            );
          })()}

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
