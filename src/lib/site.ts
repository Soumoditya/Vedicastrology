/**
 * Single source of truth for brand details.
 *
 * Kept in one place so the Instagram handle, contact routes and copy can be
 * changed without hunting through components, and later moved into the
 * admin-editable site settings without touching call sites.
 */
export const SITE = {
  name: 'Vedic Astrologey',
  tagline: 'Classical Jyotish, calculated precisely.',
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
    label: 'Birth Chart',
    sanskrit: 'Kundli',
    description:
      'Your complete Vedic chart with houses, nakshatras, dignities and all sixteen divisional charts.',
  },
  {
    href: '/tools/panchang',
    label: 'Panchang',
    sanskrit: 'Pañcāṅga',
    description:
      'Today’s tithi, nakshatra, yoga and karana with true sunrise, Rahu Kaal and auspicious windows.',
  },
  {
    href: '/tools/dasha',
    label: 'Dasha Periods',
    sanskrit: 'Vimśottarī',
    description:
      'Your planetary periods to four levels, with the exact dates each one begins and ends.',
  },
  {
    href: '/tools/transits',
    label: 'Transits',
    sanskrit: 'Gochara',
    description:
      'Where the grahas are now relative to your chart, including Sade Sati and its phases.',
  },
  {
    href: '/tools/matching',
    label: 'Compatibility',
    sanskrit: 'Guṇa Milan',
    description:
      'Ashtakoot matching across all eight koots, with Mangal dosha and its cancellations.',
  },
  {
    href: '/tools/yogas',
    label: 'Yogas and Doshas',
    sanskrit: 'Yoga · Doṣa',
    description:
      'Every combination your chart forms with the reason it was found, plus Manglik, Kalsarpa and Ashtakavarga.',
  },
  {
    href: '/tools/nakshatra',
    label: 'Nakshatra Finder',
    sanskrit: 'Nakṣatra',
    description:
      'Your birth star, its pada, ruling graha and what the classical texts say about it.',
  },
] as const;
