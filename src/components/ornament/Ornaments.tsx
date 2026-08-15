import Image from 'next/image';

/**
 * Traditional marks, redrawn as gold line-art.
 *
 * The user sent bright PNGs of Ganesha, Om and a Swastika. Dropped straight
 * onto a dark cinematic site they read as clip-art, which was part of the
 * "AI slop" complaint. So they are redrawn here as fine stroke work in the
 * site's own gold, theme-aware through `currentColor`, so they look struck into
 * the design like temple engraving rather than pasted on.
 *
 * Every one takes an optional `src`. Pass a path under /symbols and the exact
 * PNG is used instead of the drawing, which is the swap the user asked to keep
 * open. With no `src`, the line-art renders and needs no asset at all.
 */

interface OrnamentProps {
  size?: number;
  className?: string;
  /** A PNG under /public to use in place of the drawing. */
  src?: string;
  /** Accessible label. Omit to mark the ornament decorative. */
  title?: string;
}

function svgProps(size: number, className?: string, title?: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 100 100',
    className,
    role: title ? ('img' as const) : undefined,
    'aria-label': title,
    'aria-hidden': title ? undefined : true,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

function PngFallback({ src, size, className, title }: Required<Pick<OrnamentProps, 'src'>> & OrnamentProps) {
  return (
    <Image
      src={src}
      width={size ?? 100}
      height={size ?? 100}
      alt={title ?? ''}
      className={className}
      aria-hidden={title ? undefined : true}
    />
  );
}

/**
 * Om, set in an ornamented square, echoing the framed Om the user sent.
 *
 * The glyph itself is the Devanagari ॐ rather than a traced path, so it is the
 * real character at any size, and the frame is drawn around it with the corner
 * spirals of a traditional border.
 */
export function Om({ size = 100, className, src, title = 'Om' }: OrnamentProps) {
  if (src) return <PngFallback src={src} size={size} className={className} title={title} />;

  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d="M0 14 L0 4 Q0 0 4 0 L14 0" strokeWidth="1.6" />
      <path d="M6 12 Q6 6 12 6" strokeWidth="1.3" opacity="0.75" />
      <circle cx="4.5" cy="4.5" r="1.1" fill="currentColor" stroke="none" />
    </g>
  );

  return (
    <svg {...svgProps(size, className, title)}>
      {corner(8, 8, 1, 1)}
      {corner(92, 8, -1, 1)}
      {corner(8, 92, 1, -1)}
      {corner(92, 92, -1, -1)}
      <path d="M20 8 Q50 4 80 8" strokeWidth="1" opacity="0.5" />
      <path d="M20 92 Q50 96 80 92" strokeWidth="1" opacity="0.5" />
      <path d="M8 20 Q4 50 8 80" strokeWidth="1" opacity="0.5" />
      <path d="M92 20 Q96 50 92 80" strokeWidth="1" opacity="0.5" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="46"
        fill="currentColor"
        stroke="none"
        style={{ fontFamily: 'var(--font-devanagari), serif' }}
      >
        ॐ
      </text>
    </svg>
  );
}

/**
 * The Swastika, right-facing with the four dots, in its traditional form.
 *
 * Used only in clearly auspicious contexts, panchang and muhurta, where the
 * Hindu meaning is unmistakable, never as loose background decoration.
 */
export function Swastika({ size = 100, className, src, title = 'Swastika, an auspicious mark' }: OrnamentProps) {
  if (src) return <PngFallback src={src} size={size} className={className} title={title} />;

  return (
    <svg {...svgProps(size, className, title)} strokeWidth="6">
      {/* The two crossing bars with arms turning clockwise. */}
      <path d="M50 18 V82 M18 50 H82" />
      <path d="M50 18 H74 M82 50 V74 M50 82 H26 M18 50 V26" />
      {/* A dot in each quadrant, as drawn on a threshold. */}
      <g fill="currentColor" stroke="none">
        <circle cx="34" cy="34" r="3.4" />
        <circle cx="66" cy="34" r="3.4" />
        <circle cx="66" cy="66" r="3.4" />
        <circle cx="34" cy="66" r="3.4" />
      </g>
    </svg>
  );
}

/** An eight-petal lotus, the quiet ornament for section seams and the bindu. */
export function Lotus({ size = 100, className, src, title }: OrnamentProps) {
  if (src) return <PngFallback src={src} size={size} className={className} title={title ?? ''} />;

  const petals = Array.from({ length: 8 }, (_, i) => i * 45);

  return (
    <svg {...svgProps(size, className, title)}>
      <g strokeWidth="1.4">
        {petals.map((deg) => (
          <path
            key={deg}
            d="M50 50 C 42 30, 42 18, 50 8 C 58 18, 58 30, 50 50 Z"
            transform={`rotate(${deg} 50 50)`}
            opacity="0.85"
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="6" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * A Ganesha emblem, front-facing, drawn as continuous line work.
 *
 * The head is symmetric, so one half is drawn and mirrored, which is what keeps
 * a hand-authored figure balanced. It is an emblem rather than a portrait: the
 * trunk, the tusks, the wide ears, the crown and the tilak, enough to be
 * unmistakably Ganesha at the size it is used and no more.
 *
 * If the user prefers their own art, `src="/symbols/ganesha.png"` swaps it in.
 */
export function Ganesha({ size = 100, className, src, title = 'Ganesha' }: OrnamentProps) {
  if (src) return <PngFallback src={src} size={size} className={className} title={title} />;

  // The right half, mirrored to the left. Origin roughly at the face centre.
  const half = (
    <>
      {/* Crown, a small domed mukuta with a finial. */}
      <path d="M50 12 Q60 12 62 22" strokeWidth="1.6" />
      <path d="M50 8 L50 12" strokeWidth="1.6" />
      <circle cx="50" cy="6" r="1.6" fill="currentColor" stroke="none" />
      {/* Head dome down to the ear. */}
      <path d="M62 22 Q70 30 70 40" strokeWidth="1.6" />
      {/* Ear, the wide fan. */}
      <path d="M70 40 Q88 34 86 52 Q84 66 70 62" strokeWidth="1.6" />
      {/* Cheek and jaw toward the trunk. */}
      <path d="M70 62 Q66 72 58 76" strokeWidth="1.6" />
      {/* Eye. */}
      <path d="M60 40 Q64 38 67 41" strokeWidth="1.4" />
      {/* Tusk, one whole, curving in. */}
      <path d="M58 66 Q60 74 54 78" strokeWidth="1.4" />
    </>
  );

  return (
    <svg {...svgProps(size, className, title)}>
      {/* Tilak between the brows. */}
      <path d="M50 26 L50 36" strokeWidth="1.4" />
      {/* The trunk, curving down the centre and to one side. */}
      <path
        d="M50 40 Q50 60 50 72 Q50 84 42 86 Q35 87 34 80"
        strokeWidth="1.8"
      />
      {/* A small offering at the trunk tip. */}
      <circle cx="34" cy="76" r="2.4" strokeWidth="1.3" />
      {half}
      <g transform="translate(100 0) scale(-1 1)">{half}</g>
    </svg>
  );
}

/**
 * A hairline rule finished with a lotus at its centre.
 *
 * The site's plain gold rules were doing all the dividing on their own. This
 * gives a section seam a small point of craft without shouting.
 */
export function OrnamentRule({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ''}`} aria-hidden>
      <span className="rule-gold h-px w-full max-w-[7rem]" />
      <Lotus size={22} className="shrink-0" />
      <span className="rule-gold h-px w-full max-w-[7rem]" />
    </div>
  );
}
