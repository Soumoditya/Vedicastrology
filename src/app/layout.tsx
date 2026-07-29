import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Marcellus } from 'next/font/google';

import './globals.css';
import { SITE } from '@/lib/site';

/**
 * Type pairing:
 *   Marcellus — a Roman capital face, for display. Gives the site its voice.
 *   Inter — for interface and body copy, where legibility outranks character.
 *   Cormorant Garamond — italic, for pull quotes and Sanskrit terms only.
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Vedic Astrology, Charts & Readings`,
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
    title: `${SITE.name} — Vedic Astrology, Charts & Readings`,
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${marcellus.variable} ${inter.variable} ${cormorant.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
