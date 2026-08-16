import type { Metadata, Viewport } from 'next';
import {
  Cormorant_Garamond,
  Inter,
  Marcellus,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
} from 'next/font/google';

import './globals.css';
import { SITE } from '@/lib/site';
import { getLocale } from '@/lib/i18n/server';
import { HTML_LANG } from '@/lib/i18n/locales';

/**
 * Type pairing:
 *   Marcellus, a Roman capital face, for display. Gives the site its voice.
 *   Inter, for interface and body copy, where legibility outranks character.
 *   Cormorant Garamond, italic, for pull quotes and Sanskrit terms only.
 */
const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

/*
  Devanagari and Bengali need real coverage. Inter has none, so without these
  the Hindi and Bengali interface falls back to whatever the device happens to
  have, which on many Android phones is a poor match and on some desktops is
  tofu boxes.

  Loaded as CSS variables and applied by the `lang` attribute, so an English
  reader never downloads either face.
*/
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
});

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, Vedic Astrology, Charts & Readings`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'vedic astrology',
    'jyotish',
    'kundli',
    'birth chart',
    'horoscope',
    'navamsa',
    'panchang',
    'vimshottari dasha',
    'kundli matching',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name}, Vedic Astrology, Charts & Readings`,
    description: SITE.description,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a16' },
    { media: '(prefers-color-scheme: light)', color: '#fdfaf3' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /*
    The `lang` attribute is not cosmetic. It selects the font stack below, drives
    hyphenation, and decides how a screen reader pronounces the page. Devanagari
    read aloud by an English voice is unusable.
  */
  const locale = await getLocale();

  return (
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${marcellus.variable} ${inter.variable} ${cormorant.variable} ${devanagari.variable} ${bengali.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
