/**
 * The wordmark: a small hand-drawn sun-and-ray glyph beside the name.
 *
 * Drawn as SVG rather than shipped as an image so it stays crisp at any size,
 * inherits the theme colours, and costs no extra request.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        {/* Twelve rays — one per rashi. */}
        <g stroke="var(--color-gold-500)" strokeWidth="1" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const inner = 10.5;
            const outer = i % 3 === 0 ? 15 : 13.2;
            return (
              <line
                key={i}
                x1={16 + Math.cos(angle) * inner}
                y1={16 + Math.sin(angle) * inner}
                x2={16 + Math.cos(angle) * outer}
                y2={16 + Math.sin(angle) * outer}
                opacity={i % 3 === 0 ? 0.95 : 0.5}
              />
            );
          })}
        </g>
        <circle
          cx="16"
          cy="16"
          r="8"
          stroke="var(--color-gold-400)"
          strokeWidth="1"
          fill="none"
        />
        {/* The inner diamond echoes the North Indian chart. */}
        <path
          d="M16 10 L22 16 L16 22 L10 16 Z"
          stroke="var(--color-gold-300)"
          strokeWidth="0.9"
          fill="color-mix(in oklab, var(--color-gold-500) 18%, transparent)"
        />
        <circle cx="16" cy="16" r="1.6" fill="var(--color-gold-200)" />
      </svg>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className="font-display text-[0.95rem] tracking-[0.02em]"
            style={{ color: 'var(--text-primary)' }}
          >
            Vedic Astrologey
          </span>
          <span
            className="mt-[3px] text-[0.55rem] uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold-600)' }}
          >
            Jyotish
          </span>
        </span>
      )}
    </span>
  );
}
