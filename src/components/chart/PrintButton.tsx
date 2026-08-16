'use client';

/**
 * Download as PDF.
 *
 * Calls the browser's own print dialogue, where every platform offers "save as
 * PDF". That is the whole implementation: no library, no server rendering, no
 * second code path for the chart, and the output uses the fonts and vector
 * chart already on the page.
 *
 * Marked `no-print` so it does not appear in the thing it produces.
 */
export function PrintButton({ label = 'Download as PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full border px-4 py-2 text-xs transition-colors duration-300"
      style={{
        borderColor: 'var(--border-strong)',
        color: 'var(--color-gold-200)',
        transitionTimingFunction: 'var(--ease-out-soft)',
      }}
    >
      {label}
    </button>
  );
}
