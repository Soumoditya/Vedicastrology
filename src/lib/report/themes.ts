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
 * Night keeps its photographs; the three paper grounds are drawn. The crop that
 * cut the old covers in half is fixed rather than sidestepped: the plates are
 * 900×1600 against a page of 0.687, so `object-fit: cover` threw away about
 * eighteen per cent of the height. They are anchored to the top now, which is
 * where the composition of all four of these images actually lives, so what gets
 * trimmed is empty sky rather than the subject.
 */

export type ThemeKey = 'night' | 'ivory' | 'parchment' | 'classical';

/**
 * Everything about a ground that is not a colour.
 *
 * This block is the answer to "all four look the same, just a different
 * colour", which was literally true: the sheet carried no theme conditionals at
 * all, so the four shared one set of faces, sizes, rule weights and cover
 * layout. A ground is a way of making a book, not a palette.
 */
export interface ThemeStyle {
  /** Body face, as a full CSS stack. */
  bodyFont: string;
  /** Display face, for headings and the cover. */
  displayFont: string;
  bodySize: string;
  bodyLeading: string;
  /** How a section announces itself under its title. */
  headRule: 'hairline' | 'double' | 'none' | 'numbered';
  headAlign: 'left' | 'center';
  /** A drop cap on the opening paragraph of each section. */
  dropCap: boolean;
  /** How a table is ruled. */
  tableStyle: 'ruled' | 'zebra' | 'open';
  /** Page margins, as a CSS shorthand. A manuscript ground is asymmetric. */
  pageMargin: string;
  /** How the cover and part dividers are composed. */
  plateStyle: 'photographic' | 'bordered' | 'framed' | 'plain';
  /**
   * Which way the page canvas leans.
   *
   * Chrome does not paint the document background into a PDF's page-margin
   * band — that strip belongs to the user agent, and its colour comes from
   * 'color-scheme'. Headless Chrome runs dark, so every report printed with a
   * near-black frame around the paper whatever the ground. Declaring it puts
   * the band within a shade or two of the sheet instead of fighting it.
   */
  colorScheme: 'light' | 'dark';
}

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
  /**
   * The photographic plates, where a theme has them.
   *
   * Only Night does. The paper grounds are drawn, because an engraving prints
   * and a night sky costs a colour cartridge — but that is a property of the
   * theme, not a judgement about the art, and removing it from Night was a
   * mistake I made unasked.
   *
   * `page` is the quiet one: laid behind the text of every content page at low
   * opacity, so a page reads as printed on something rather than on nothing.
   */
  art?: {
    cover: string;
    dividers: string[];
    back: string;
    page: string;
  };
  style: ThemeStyle;
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
    art: {
      cover: '/report/cover.jpg',
      // One per part divider, in order. Four parts, and the fourth returns to
      // the mandala deliberately — it opens the remedies, which is where the
      // document turns back toward practice.
      dividers: [
        '/report/mandala.jpg',
        '/report/frame.jpg',
        '/report/om.jpg',
        '/report/mandala.jpg',
      ],
      back: '/report/om.jpg',
      /*
        Behind the body text, at a whisper. The brief was a plain image with few
        objects in it, and the mandala is the closest of the four — one centred
        figure, no horizon, nothing that competes with a line of type.
      */
      page: '/report/mandala.jpg',
    },
    style: {
      bodyFont: "'Inter', ui-sans-serif, system-ui, sans-serif",
      displayFont: "'Marcellus', Georgia, serif",
      bodySize: '10pt',
      bodyLeading: '1.55',
      headRule: 'hairline',
      headAlign: 'left',
      dropCap: false,
      tableStyle: 'ruled',
      pageMargin: '16mm 15mm 18mm',
      plateStyle: 'photographic',
      colorScheme: 'dark',
    },
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
    style: {
      bodyFont: "'Spectral', Georgia, serif",
      displayFont: "'Marcellus', Georgia, serif",
      bodySize: '10.5pt',
      bodyLeading: '1.6',
      headRule: 'double',
      headAlign: 'center',
      dropCap: false,
      tableStyle: 'ruled',
      pageMargin: '18mm 17mm 20mm',
      plateStyle: 'bordered',
      colorScheme: 'light',
    },
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
    style: {
      bodyFont: "'EB Garamond', Georgia, serif",
      displayFont: "'Cormorant Garamond', Georgia, serif",
      bodySize: '11.5pt',
      bodyLeading: '1.62',
      headRule: 'none',
      headAlign: 'left',
      dropCap: true,
      tableStyle: 'open',
      /* Asymmetric, as a manuscript is: a wide outer margin to hold it by. */
      pageMargin: '20mm 26mm 22mm 16mm',
      plateStyle: 'framed',
      colorScheme: 'light',
    },
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
    style: {
      bodyFont: "'Libre Baskerville', Georgia, serif",
      displayFont: "'Libre Baskerville', Georgia, serif",
      bodySize: '9.5pt',
      bodyLeading: '1.5',
      headRule: 'numbered',
      headAlign: 'left',
      dropCap: false,
      tableStyle: 'zebra',
      pageMargin: '15mm 14mm 16mm',
      plateStyle: 'plain',
      colorScheme: 'light',
    },
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
