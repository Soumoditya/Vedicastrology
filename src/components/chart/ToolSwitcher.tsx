import Link from 'next/link';

import { TOOL_LINKS } from '@/lib/site';
import { canUseAll } from '@/lib/features/flags';

/**
 * One chart, every tool.
 *
 * Each tool page used to be a dead end: it showed its result and then offered a
 * blank form headed "another chart". So looking at your dasha and then wanting
 * your yogas meant typing your birth details in again, and again for the next
 * one. Reported as annoying, and rightly.
 *
 * The birth details are already in the query string, so carrying them across is
 * a matter of rebuilding the same query against a different path. This appears
 * on every tool result page, which turns seven separate calculators into one
 * thing you enter your details into once.
 *
 * The panchang is left out on purpose: it is about a day and a place, not about
 * a person, so a birth query means nothing to it.
 */
export async function ToolSwitcher({
  current,
  params,
  query: explicit,
  heading = 'Same chart, elsewhere',
}: {
  /** The feature key of the page this is rendered on. */
  current: string;
  /** The current page's search params, carried across unchanged. */
  params?: Record<string, string | string[] | undefined>;
  /**
   * An explicit query instead. Matching holds two charts under prefixed keys,
   * so its own params mean nothing to a single chart tool; it passes each
   * person's query separately.
   */
  query?: string;
  heading?: string;
}) {
  let suffix = explicit ?? '';

  if (!explicit && params) {
    const built = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      built.set(key, Array.isArray(value) ? value[0] : value);
    }
    suffix = built.toString();
  }

  if (!suffix) return null;

  const usable = TOOL_LINKS.filter(
    (tool) => tool.feature !== current && tool.feature !== 'panchang',
  );

  const access = await canUseAll(usable.map((t) => t.feature));
  const tools = usable.filter((t) => access[t.feature].reason !== 'disabled');

  if (tools.length === 0) return null;

  return (
    <nav
      aria-label="The same chart in another tool"
      className="mb-6 last:mb-10"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {heading}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={`${tool.href}?${suffix}`}
            className="rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-300"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              transitionTimingFunction: 'var(--ease-out-soft)',
            }}
          >
            {tool.label}
            {!access[tool.feature].allowed && (
              <span style={{ color: 'var(--color-gold-600)' }}> ·</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
