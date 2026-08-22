/**
 * One line glyph per tool.
 *
 * The tool list numbered itself 01 to 12, which reads as a table of contents —
 * an order to work through — when what it actually is is a set of instruments
 * you pick from. A mark says "this is a thing that does something"; a numeral
 * says "this is the fourth of twelve".
 *
 * Drawn rather than borrowed. No icon library: the site already has a stroke
 * language in `Ornaments.tsx` — thin gold line, round caps, no fill — and a set
 * from anywhere else would sit beside the Om and the lotus looking like it came
 * from a different site, which it would have.
 *
 * Each mark tries to be about its tool rather than decorative:
 * the birth chart is the North Indian diamond, the panchang is a sun over a
 * horizon, dasha is a divided bar of time, transits are a body crossing a path,
 * matching is two overlapping circles, yogas are three points joined, remedies
 * is a lamp, the nakshatra finder is a star and its pada, sade sati is Saturn's
 * ring, manglik is Mars, kalsarpa is the serpent between the nodes, gemstones
 * is a cut stone, and the full report is a bound page.
 *
 * Keyed by feature, so `TOOL_LINKS` drives which one appears and a tool added
 * later without a mark simply falls back to nothing rather than throwing.
 */

const COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Paths in a 24×24 field. */
const MARKS: Record<string, React.ReactNode> = {
  // The North Indian chart: square, both diagonals, and the inner diamond.
  kundli: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <path d="M3.5 3.5 L20.5 20.5 M20.5 3.5 L3.5 20.5" />
      <path d="M12 3.5 L3.5 12 L12 20.5 L20.5 12 Z" />
    </>
  ),

  // Sunrise over a horizon: the five limbs are all reckoned from it.
  panchang: (
    <>
      <path d="M2.5 17.5 H21.5" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M12 4 V6.5 M5.6 6.6 L7.4 8.4 M18.4 6.6 L16.6 8.4" />
    </>
  ),

  // Time divided into unequal periods, which is what a dasha sequence is.
  dasha: (
    <>
      <path d="M3 12 H21" />
      <path d="M3 8.5 V15.5 M9 9.5 V14.5 M13.5 9.5 V14.5 M21 8.5 V15.5" />
      <circle cx="9" cy="12" r="1.6" />
    </>
  ),

  // A body crossing a fixed path.
  transits: (
    <>
      <ellipse cx="12" cy="12" rx="9.5" ry="5" transform="rotate(-20 12 12)" />
      <circle cx="18" cy="8.5" r="2.4" />
    </>
  ),

  // Two charts overlapping. The shared area is the whole subject.
  matching: (
    <>
      <circle cx="9" cy="12" r="6.2" />
      <circle cx="15" cy="12" r="6.2" />
    </>
  ),

  // A combination: three placements that only mean something joined up.
  yogas: (
    <>
      <path d="M12 4 L19.5 17.5 L4.5 17.5 Z" />
      <circle cx="12" cy="4" r="1.7" />
      <circle cx="19.5" cy="17.5" r="1.7" />
      <circle cx="4.5" cy="17.5" r="1.7" />
    </>
  ),

  // A lamp: conduct first, and the cheapest remedy there is.
  remedies: (
    <>
      <path d="M6 15.5 Q12 17.5 18 15.5 L16.5 19.5 Q12 21 7.5 19.5 Z" />
      <path d="M12 15.5 V12" />
      <path d="M12 12 Q9.5 9.5 12 6 Q14.5 9.5 12 12 Z" />
    </>
  ),

  // A star and the quarter of it you were born in.
  nakshatra: (
    <>
      <path d="M12 3 L13.9 9.4 L20.5 9.4 L15.2 13.3 L17.1 19.7 L12 15.8 L6.9 19.7 L8.8 13.3 L3.5 9.4 L10.1 9.4 Z" />
      <path d="M12 15.8 V19.7" opacity="0.5" />
    </>
  ),

  // Saturn, by its ring.
  sade_sati: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-20 12 12)" />
    </>
  ),

  // Mars.
  manglik: (
    <>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14.5 9.5 L20.5 3.5 M15.5 3.5 H20.5 V8.5" />
    </>
  ),

  // The serpent, strung between the two nodes.
  kalsarpa: (
    <>
      <path d="M4 16 Q8 9 12 12.5 Q16 16 20 8.5" />
      <circle cx="4" cy="16" r="1.8" />
      <circle cx="20" cy="8.5" r="1.8" />
    </>
  ),

  // A cut stone, seen from above.
  gemstones: (
    <>
      <path d="M8 4 H16 L21 10 L12 20.5 L3 10 Z" />
      <path d="M3 10 H21 M8 4 L12 10 L16 4 M12 10 V20.5" />
    </>
  ),

  // The whole chart, bound.
  full_report: (
    <>
      <path d="M5 4.5 H15 L19 8.5 V19.5 H5 Z" />
      <path d="M15 4.5 V8.5 H19" />
      <path d="M8 12.5 H16 M8 15.5 H16" />
    </>
  ),
};

export function ToolMark({
  feature,
  size = 22,
  className,
}: {
  feature: string;
  size?: number;
  className?: string;
}) {
  const mark = MARKS[feature];
  // A tool added to TOOL_LINKS without a mark drops back to nothing rather
  // than throwing or drawing a placeholder box.
  if (!mark) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      {...COMMON}
    >
      {mark}
    </svg>
  );
}
