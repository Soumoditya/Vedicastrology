'use client';

import { useState } from 'react';

import { VedicChart, type ChartStyle } from './VedicChart';
import { ChartLegend } from './ChartLegend';
import type { ChartRenderData } from '@/lib/chart-render/geometry';
import {
  BHAVA_NAMES,
  BHAVA_SIGNIFICATIONS,
  RASHI_NAMES_EN,
  RASHI_SYMBOLS,
} from '@/lib/astro/constants';

export interface WorkspaceVarga {
  code: string;
  name: string;
  signification: string;
  data: ChartRenderData;
}

export interface WorkspaceHouse {
  house: number;
  rashi: number;
  lord: string;
  occupants: { graha: string; label: string }[];
  aspectedBy: string[];
}

export interface ChartWorkspaceProps {
  vargas: WorkspaceVarga[];
  houses: WorkspaceHouse[];
  /** From the visitor's saved settings, or the default when they have none. */
  initialStyle?: ChartStyle;
  /** False hides the switch entirely, when the capability is gated. */
  canSwitchStyle?: boolean;
}

/**
 * The interactive chart panel.
 *
 * Holds the two pieces of state the chart itself should not own: which
 * divisional chart is on screen, and which house the visitor has selected.
 */
export function ChartWorkspace({
  vargas,
  houses,
  initialStyle = 'north-indian',
  canSwitchStyle = true,
}: ChartWorkspaceProps) {
  const [activeCode, setActiveCode] = useState(vargas[0]?.code ?? 'D1');
  const [selected, setSelected] = useState<number | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>(initialStyle);

  const active = vargas.find((v) => v.code === activeCode) ?? vargas[0];
  const detail = selected ? houses.find((h) => h.house === selected) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Divisional chart selector */}
        <div className="flex flex-wrap gap-1.5">
          {vargas.map((v) => {
            const isActive = v.code === activeCode;
            return (
              <button
                key={v.code}
                type="button"
                onClick={() => {
                  setActiveCode(v.code);
                  setSelected(null);
                }}
                title={v.signification}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300"
                style={{
                  borderColor: isActive ? 'var(--border-strong)' : 'var(--border-subtle)',
                  background: isActive
                    ? 'color-mix(in oklab, var(--color-gold-500) 14%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--color-gold-200)' : 'var(--text-secondary)',
                  transitionTimingFunction: 'var(--ease-out-soft)',
                }}
              >
                {v.code}
              </button>
            );
          })}
        </div>

        {/* Chart style. Two long-standing regional conventions for drawing the
            same data, not a preference about which is correct. */}
        {canSwitchStyle && (
          <div
            className="flex overflow-hidden rounded-full border text-xs"
            style={{ borderColor: 'var(--border-subtle)' }}
            role="radiogroup"
            aria-label="Chart style"
          >
            {(
              [
                ['north-indian', 'North'],
                ['south-indian', 'South'],
              ] as const
            ).map(([value, label]) => {
              const isActive = chartStyle === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => {
                    setChartStyle(value);
                    setSelected(null);
                  }}
                  className="px-3 py-1.5 transition-colors duration-300"
                  style={{
                    background: isActive
                      ? 'color-mix(in oklab, var(--color-gold-500) 14%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--color-gold-200)' : 'var(--text-secondary)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Chart */}
        <div>
          <div className="mb-3">
            <h3
              className="font-display text-lg"
              style={{ color: 'var(--color-gold-200)' }}
            >
              {active.name}{' '}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ({active.code})
              </span>
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {active.signification}
            </p>
          </div>

          <div className="relative mx-auto max-w-lg">
            {/* Soft aura behind the chart. */}
            <div
              aria-hidden
              className="aura pointer-events-none absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--color-gold-500) 22%, transparent), transparent 65%)',
              }}
            />
            <VedicChart
              key={`${active.code}-${chartStyle}`}
              data={active.data}
              style={chartStyle}
              showDegrees={active.code === 'D1'}
              onSelectHouse={setSelected}
              selectedHouse={selected}
            />
          </div>

          <ChartLegend />
        </div>

        {/* Detail panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {detail ? (
            <div className="surface-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4
                  className="font-display text-base"
                  style={{ color: 'var(--color-gold-200)' }}
                >
                  House {detail.house}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear
                </button>
              </div>

              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {BHAVA_NAMES[detail.house - 1]} bhava
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Sign">
                  {RASHI_SYMBOLS[detail.rashi]} {RASHI_NAMES_EN[detail.rashi]}
                </Row>
                <Row label="Lord">{detail.lord}</Row>
                <Row label="Occupied by">
                  {detail.occupants.length
                    ? detail.occupants.map((o) => o.label).join(', ')
                    : 'None'}
                </Row>
                <Row label="Aspected by">
                  {detail.aspectedBy.length ? detail.aspectedBy.join(', ') : 'None'}
                </Row>
              </dl>

              <div className="rule-gold my-4" />

              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {BHAVA_SIGNIFICATIONS[detail.house - 1]}
              </p>
            </div>
          ) : (
            <div
              className="surface-card p-5 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              <p className="font-display text-base" style={{ color: 'var(--text-secondary)' }}>
                Reading the chart
              </p>
              <p className="mt-2.5 leading-relaxed">
                {chartStyle === 'north-indian'
                  ? 'In the North Indian style the houses never move, the first house is always the diamond at the top. What changes from chart to chart is the rashi number written inside each one.'
                  : 'In the South Indian style the signs never move, Aries is always the same square. What changes is which one holds the ascendant, marked by the diagonal, and the houses are counted clockwise from there.'}
              </p>
              <p className="mt-2.5 leading-relaxed">
                Select any house to see its sign, its lord, which grahas sit
                there and which aspect it.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="text-right" style={{ color: 'var(--text-primary)' }}>
        {children}
      </dd>
    </div>
  );
}
