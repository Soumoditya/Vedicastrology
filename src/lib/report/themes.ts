import type { ChartPalette } from '@/lib/chart-render/svgString';

/**
 * The report's four grounds.
 *
 * Asked for as a set rather than a choice: four documents to compare side by
 * side before settling on one. So the report takes a `?theme=` and everything
 * that carries colour — the page, the rules, the tables, the chart plates —
 * reads from one record rather than from scattered literals.
 *
 * The chart palette lives here too, and that is the point of having done the
 * work in `svgString.ts`. A plate drawn in gold on midnight is unreadable on
 * ivory; before this it had no way to be told which paper it was sitting on.
 *
 * No ground uses the photographic plates any more, including the dark one. The
 * four `public/report/*.jpg` files are 900×1600 against a page of 0.687, so
 * `object-fit: cover` cropped about eighteen per cent off the top and bottom of
 * every one — the "images cut in half" that was reported. Covers and dividers
 * are drawn from the site's own geometry instead, which cannot be cropped by
 * arithmetic and prints without a colour cartridge.
 */

export type ThemeKey = 'night' | 'ivory' | 'parchment' | 'classical';

export interface ReportTheme {
  key: ThemeKey;
  /** Shown in the theme switcher. */
  name: string;
  /** One line on what it is for, for the switcher. */
  note: string;
  /** Page ground. */
  paper: string;
  /** Body text. */
  ink: string;
  /** Captions, provenance, the quieter half of a table. */
  muted: string;
  /** Hairlines and table rules. */
  rule: string;
  /** Headings and the one colour that is allowed to be loud. */
  accent: string;
  /** A panel a shade off the page, for notes and cover cards. */
  panel: string;
  /** Cover and divider ground, where it differs from the page. */
  coverPaper: string;
  coverInk: string;
  chart: ChartPalette;
}

const THEMES: Record<ThemeKey, ReportTheme> = {
  /*
    The original, corrected rather than replaced. Kept because it is the site's
    own look on screen and somebody may want the document to match it.
  */
  night: {
    key: 'night',
    name: 'Night',
    note: 'The site’s own dark ground, with the cosmic plates.',
    paper: '#0b1020',
    ink: '#ece3cd',
    muted: '#9d947f',
    rule: '#2b3350',
    accent: '#e8c877',
    panel: '#141a2e',
    /*
      The same as the page. Plates no longer bleed to the paper edge — see the
      note on '@page plate' — so a cover ground even slightly darker than the
      page would show as a band inside the margin rather than as a full sheet.
    */
    coverPaper: '#0b1020',
    coverInk: '#f2e6c8',
    chart: {
      background: '#0a0a16',
      rule: '#c9a227',
      accent: '#c9a227',
      numeral: '#8c7220',
      ink: '#f4efe2',
      inkSoft: '#b9b0a0',
      nature: { benefic: '#4ba97a', malefic: '#c8544f', neutral: '#cfc7b4' },
    },
  },

  /*
    The palette of a printed panchang or a wedding patrika: warm ivory, brown-black
    ink, kumkum red, and gold used only on rules. The most recognisably traditional
    of the four to an Indian reader, and it survives a cheap printer.
  */
  ivory: {
    key: 'ivory',
    name: 'Ivory & kumkum',
    note: 'Warm ivory, brown-black ink, kumkum red. Almanac, not brochure.',
    paper: '#FBF7EF',
    ink: '#241C14',
    muted: '#6B5F4E',
    rule: '#B08C3A',
    accent: '#9B2226',
    panel: '#F4EDDF',
    coverPaper: '#F6EFE0',
    coverInk: '#241C14',
    chart: {
      background: '#FFFDF7',
      rule: '#B08C3A',
      accent: '#9B2226',
      numeral: '#8a6f2e',
      ink: '#241C14',
      inkSoft: '#6B5F4E',
      nature: { benefic: '#1f5c33', malefic: '#9B2226', neutral: '#4a4133' },
    },
  },

  /*
    Aged manuscript rather than printed almanac: lower contrast, softer, more
    scholarly. Gentler on screen and weaker on a bad printer, which is the trade.
  */
  parchment: {
    key: 'parchment',
    name: 'Parchment & sepia',
    note: 'Aged ground, sepia ink, burnt orange. Manuscript rather than almanac.',
    paper: '#F5EEE0',
    ink: '#3A2E22',
    muted: '#7A6B58',
    rule: '#A9884E',
    accent: '#B5651D',
    panel: '#EEE4D2',
    coverPaper: '#EFE5D1',
    coverInk: '#3A2E22',
    chart: {
      background: '#FBF6EA',
      rule: '#A9884E',
      accent: '#B5651D',
      numeral: '#8b7145',
      ink: '#3A2E22',
      inkSoft: '#7A6B58',
      nature: { benefic: '#3d6b45', malefic: '#a3492a', neutral: '#5b5041' },
    },
  },

  /*
    Reference-book restraint: near-white, true black, one saffron accent, gold on
    rules only. Highest contrast and cheapest to print, least ornamental.
  */
  classical: {
    key: 'classical',
    name: 'White & saffron',
    note: 'Near-white, black ink, one saffron accent. A reference book.',
    paper: '#FEFCF8',
    ink: '#1A1A1A',
    muted: '#57534E',
    rule: '#C9A227',
    accent: '#D97706',
    panel: '#F7F3EA',
    coverPaper: '#FDFAF3',
    coverInk: '#1A1A1A',
    chart: {
      background: '#FFFFFF',
      rule: '#C9A227',
      accent: '#D97706',
      numeral: '#9a7c1e',
      ink: '#1A1A1A',
      inkSoft: '#57534E',
      nature: { benefic: '#1f5c33', malefic: '#a32020', neutral: '#3f3f3f' },
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export const DEFAULT_THEME: ThemeKey = 'ivory';

/** Resolve a `?theme=` value, falling back rather than throwing on a typo. */
export function resolveTheme(value: string | string[] | undefined): ReportTheme {
  const key = Array.isArray(value) ? value[0] : value;
  return (key && THEMES[key as ThemeKey]) || THEMES[DEFAULT_THEME];
}

/**
 * The theme as custom properties, for the document root.
 *
 * Emitted as a style string rather than a class so the four can coexist without
 * four copies of every rule in the stylesheet.
 */
export function themeVariables(t: ReportTheme): Record<string, string> {
  return {
    '--rp-paper': t.paper,
    '--rp-ink': t.ink,
    '--rp-muted': t.muted,
    '--rp-rule': t.rule,
    '--rp-accent': t.accent,
    '--rp-panel': t.panel,
    '--rp-cover-paper': t.coverPaper,
    '--rp-cover-ink': t.coverInk,
  };
}
