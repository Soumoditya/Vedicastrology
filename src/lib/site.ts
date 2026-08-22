/**
 * Single source of truth for brand details.
 *
 * Kept in one place so the Instagram handle, contact routes and copy can be
 * changed without hunting through components, and later moved into the
 * admin-editable site settings without touching call sites.
 */
export const SITE = {
  name: 'Vedic Astrologey',
  tagline: 'Classical Jyotish, read with care.',
  description:
    'Accurate Vedic birth charts, panchang, dasha periods and transit ' +
    'readings, calculated with the Swiss Ephemeris. Free chart tools and ' +
    'personal consultations.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vedicastrologey.com',
  instagram: 'vedic_astrologey',
  instagramUrl: 'https://instagram.com/vedic_astrologey',
} as const;

export const NAV_LINKS = [
  { href: '/tools', label: 'Free Tools' },
  { href: '/services', label: 'Consultations' },
  { href: '/blog', label: 'Journal' },
  { href: '/about', label: 'About' },
] as const;

export const TOOL_LINKS = [
  {
    href: '/tools/kundli',
    feature: 'kundli',
    label: 'Birth Chart',
    sanskrit: 'Kundli',
    description:
      'Your complete Vedic chart with houses, nakshatras, dignities and all sixteen divisional charts.',
  },
  {
    href: '/tools/panchang',
    feature: 'panchang',
    label: 'Panchang',
    sanskrit: 'Pañcāṅga',
    description:
      'Today’s tithi, nakshatra, yoga and karana with true sunrise, Rahu Kaal and auspicious windows.',
  },
  {
    href: '/tools/dasha',
    feature: 'dasha',
    label: 'Dasha Periods',
    sanskrit: 'Vimśottarī',
    description:
      'Your planetary periods to four levels, with the exact dates each one begins and ends.',
  },
  {
    href: '/tools/transits',
    feature: 'transits',
    label: 'Transits',
    sanskrit: 'Gochara',
    description:
      'Today drawn on your own chart, counted from the ascendant and from the Moon, and read against both.',
  },
  {
    href: '/tools/matching',
    feature: 'matching',
    label: 'Compatibility',
    sanskrit: 'Guṇa Milan',
    description:
      'Ashtakoot matching across all eight koots, with Mangal dosha and its cancellations.',
  },
  {
    href: '/tools/yogas',
    feature: 'yogas',
    label: 'Yogas and Doshas',
    sanskrit: 'Yoga · Doṣa',
    description:
      'Every combination your chart forms with the reason it was found, plus Manglik, Kalsarpa and Ashtakavarga.',
  },
  {
    href: '/tools/remedies',
    feature: 'remedies',
    label: 'Remedies',
    sanskrit: 'Upāya',
    description:
      'Every graha in your chart read in turn, with practical advice for the house it sits in and the classical measure for it.',
  },
  {
    href: '/tools/gemstones',
    feature: 'gemstones',
    label: 'Gemstones',
    sanskrit: 'Ratna',
    description:
      'Which stones your chart would traditionally be given, how each is worn, and why the tradition puts them last.',
  },
  {
    href: '/tools/nakshatra',
    feature: 'nakshatra',
    label: 'Nakshatra Finder',
    sanskrit: 'Nakṣatra',
    description:
      'Your birth star, its pada, ruling graha and what the classical texts say about it.',
  },
  {
    href: '/tools/sade-sati',
    feature: 'sade_sati',
    label: 'Sade Sati',
    sanskrit: 'Sāḍe Sātī',
    description:
      "Saturn's seven and a half years over your Moon, every phase dated to the day, with Kantaka and Ashtama Shani.",
  },
  {
    href: '/tools/manglik',
    feature: 'manglik',
    label: 'Manglik Check',
    sanskrit: 'Maṅgala Doṣa',
    description:
      'Checked from the ascendant, the Moon and Venus alike, with every cancellation that applies to your chart.',
  },
  {
    href: '/tools/kalsarpa',
    feature: 'kalsarpa',
    label: 'Kalsarpa Dosha',
    sanskrit: 'Kālasarpa',
    description:
      'Measured by the real arc from Rahu rather than by house, naming which of the twelve forms it is.',
  },
  {
    href: '/report',
    feature: 'full_report',
    label: 'Full Written Report',
    sanskrit: 'Sampūrṇa Phala',
    description:
      'Everything in one document, twenty pages, laid out for print and downloadable in English, Hindi or Bengali.',
  },
] as const;

/**
 * The three specific afflictions people search for by name.
 *
 * Kept apart from the main journey because they are checks rather than steps:
 * you do not read a chart by going through them in order, you look one up
 * because somebody has told you that you have it.
 */
export const CHECK_FEATURES = ['manglik', 'kalsarpa', 'sade_sati', 'gemstones'] as const;

/** The order of understanding a chart, by feature key. */
export const JOURNEY = ['kundli', 'nakshatra', 'dasha', 'yogas', 'transits', 'remedies', 'matching'] as const;

export const STEP_VERB: Record<string, string> = {
  kundli: 'Your chart',
  nakshatra: 'Your star',
  dasha: 'What is running',
  yogas: 'What it forms',
  transits: 'What is coming',
  remedies: 'What helps',
  matching: 'With another',
};
