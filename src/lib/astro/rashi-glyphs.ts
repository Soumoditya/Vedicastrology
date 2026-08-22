/**
 * The twelve rāśi glyphs, drawn.
 *
 * They used to be the Unicode characters U+2648..U+2653 set in a bare `<text>`
 * with no font-family, which inherited the site's body face. Inter's latin
 * subset does not cover that block and next/font's metric-matched fallback
 * declares no unicode-range, so the browser drew `.notdef` — the small filled
 * boxes that appeared around the mandala and on the cover of every report. At
 * the size the chakra uses them, a tofu box and a glyph are the same shape.
 *
 * Drawn paths cannot fall back to anything. They also print: a PDF embeds the
 * outline rather than hunting for a font that has the character, which is the
 * same reason the report's faces are self-hosted.
 *
 * Each path is stroked, not filled, on a 24x24 box with the figure roughly
 * centred, so they sit consistently with the rest of the gold line-art. Order is
 * Aries first, matching `RASHI_NAMES` and every other twelve-long table here.
 */
export const RASHI_GLYPH_PATHS: readonly string[] = [
  // Meṣa — the ram's horns.
  'M12 20V10M12 10c0-4-3-6-5.5-4.5S4 11 7 12.5M12 10c0-4 3-6 5.5-4.5S20 11 17 12.5',
  // Vṛṣabha — the bull's head and horns.
  'M12 20a4.2 4.2 0 100-8.4 4.2 4.2 0 000 8.4M5 5c0 4 3 6.6 7 6.6S19 9 19 5',
  // Mithuna — the twins.
  'M8 5v14M16 5v14M6 5h12M6 19h12',
  // Karka — the crab, two claws curled opposite ways.
  'M19 10c0-2.6-3.2-4.4-7-4.4S5.2 7.2 5 9.6M5 14.4c0 2.6 3.2 4.4 7 4.4s6.8-1.6 7-4M7.6 12.6a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2M16.4 7.2a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2',
  // Siṁha — the lion's mane and tail.
  'M9.5 19.4a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2M12.4 16c-.6-4 .2-7.4 2.4-8.8 2-1.3 4.2-.2 4.2 1.9 0 1.9-1.9 2.8-1.9 4.4 0 1.3 1 2.1 2.1 2.1',
  // Kanyā — the maiden, three strokes and a closing loop.
  'M4 18V9M4 9.6c0-2.2 3-2.2 3 0V18M7 9.6c0-2.2 3-2.2 3 0V18M10 9.6c0-2.2 3.2-2.2 3.6 1.2.5 3.6-.4 6.4-2.6 7.8 3.4.6 5.8-1.4 6-4.6',
  // Tulā — the scales: a beam, a rising sun, a base.
  'M4 19h16M4 14.2h4.2M15.8 14.2H20M8.2 14.2a3.8 3.8 0 017.6 0',
  // Vṛścika — the scorpion, three strokes and a sting.
  'M4 18V9M4 9.6c0-2.2 3-2.2 3 0V18M7 9.6c0-2.2 3-2.2 3 0V18M10 9.6c0-2.2 3-2.2 3 0v8.8l3.8 2.6M16.2 17.6l1.4 3.2-3.4.2',
  // Dhanus — the archer's arrow.
  'M5.5 18.5L18 6M18 6h-5.4M18 6v5.4M8.6 11.2l4.2 4.2',
  // Makara — the sea-goat, horn into a fish tail.
  'M4 8.6c0-2.4 3-2.4 3.2.8L7.6 18M7.6 10.4c0-3.4 3.4-3.6 4.2-.4.7 2.9.6 5.6.6 7.4M12.4 16.6c1.6-3.2 6-2.6 6 .6s-3.2 3.8-5.2 1.8',
  // Kumbha — the water-bearer's two waves.
  'M3.4 10.4c2-2.2 3.2-2.2 5.2 0s3.2 2.2 5.2 0 3.2-2.2 5.2 0M3.4 15.4c2-2.2 3.2-2.2 5.2 0s3.2 2.2 5.2 0 3.2-2.2 5.2 0',
  // Mīna — two fishes bound together.
  'M7.4 4c-3 3.4-3 12.6 0 16M16.6 4c3 3.4 3 12.6 0 16M4.8 12h14.4',
];
