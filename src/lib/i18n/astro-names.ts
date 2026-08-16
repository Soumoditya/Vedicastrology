import type { Locale } from './locales';
import {
  BHAVA_NAMES,
  NAKSHATRA_NAMES,
  RASHI_NAMES_EN,
  TITHI_NAMES,
  VARA_NAMES_EN,
  type AnyGraha,
} from '@/lib/astro/constants';
import { DIGNITY_LABEL } from '@/lib/astro/dignity';
import type { Dignity } from '@/lib/astro/types';

/**
 * The astrological vocabulary, in each language.
 *
 * This is the part of translation that actually matters here. A tool page is
 * mostly graha names, sign names and nakshatra names repeated dozens of times;
 * translating the surrounding chrome while leaving "Sun in Gemini, friend" in
 * English changes almost nothing on screen, which is exactly the complaint
 * that prompted this.
 *
 * Names are transliterated into the reader's own script rather than replaced
 * with an equivalent, because they are proper nouns: Rohini is Rohini whether
 * written रोहिणी or রোহিণী, and a Bengali reader looking for রোহিণী will not
 * recognise "Rohini" set in Latin. The English column keeps the Latin
 * transliteration already used across the engine, so nothing changes for an
 * English reader.
 *
 * English is the fallback for any name a language has not supplied, matching
 * how the interface dictionary behaves.
 */

type Names = Record<Locale, readonly string[]>;

// ---------------------------------------------------------------------------
// Rashi
// ---------------------------------------------------------------------------

const RASHI: Names = {
  en: RASHI_NAMES_EN,
  hi: [
    'मेष',
    'वृषभ',
    'मिथुन',
    'कर्क',
    'सिंह',
    'कन्या',
    'तुला',
    'वृश्चिक',
    'धनु',
    'मकर',
    'कुम्भ',
    'मीन',
  ],
  bn: [
    'মেষ',
    'বৃষ',
    'মিথুন',
    'কর্কট',
    'সিংহ',
    'কন্যা',
    'তুলা',
    'বৃশ্চিক',
    'ধনু',
    'মকর',
    'কুম্ভ',
    'মীন',
  ],
};

// ---------------------------------------------------------------------------
// Graha
// ---------------------------------------------------------------------------

const GRAHA_ORDER: AnyGraha[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
];

const GRAHA: Names = {
  en: GRAHA_ORDER,
  hi: ['सूर्य', 'चन्द्र', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'राहु', 'केतु'],
  bn: ['সূর্য', 'চন্দ্র', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি', 'রাহু', 'কেতু'],
};

// ---------------------------------------------------------------------------
// Nakshatra
// ---------------------------------------------------------------------------

const NAKSHATRA: Names = {
  en: NAKSHATRA_NAMES,
  hi: [
    'अश्विनी',
    'भरणी',
    'कृत्तिका',
    'रोहिणी',
    'मृगशिरा',
    'आर्द्रा',
    'पुनर्वसु',
    'पुष्य',
    'आश्लेषा',
    'मघा',
    'पूर्वा फाल्गुनी',
    'उत्तरा फाल्गुनी',
    'हस्त',
    'चित्रा',
    'स्वाति',
    'विशाखा',
    'अनुराधा',
    'ज्येष्ठा',
    'मूल',
    'पूर्वाषाढ़ा',
    'उत्तराषाढ़ा',
    'श्रवण',
    'धनिष्ठा',
    'शतभिषा',
    'पूर्व भाद्रपद',
    'उत्तर भाद्रपद',
    'रेवती',
  ],
  bn: [
    'অশ্বিনী',
    'ভরণী',
    'কৃত্তিকা',
    'রোহিণী',
    'মৃগশিরা',
    'আর্দ্রা',
    'পুনর্বসু',
    'পুষ্যা',
    'অশ্লেষা',
    'মঘা',
    'পূর্বফাল্গুনী',
    'উত্তরফাল্গুনী',
    'হস্তা',
    'চিত্রা',
    'স্বাতী',
    'বিশাখা',
    'অনুরাধা',
    'জ্যেষ্ঠা',
    'মূলা',
    'পূর্বাষাঢ়া',
    'উত্তরাষাঢ়া',
    'শ্রবণা',
    'ধনিষ্ঠা',
    'শতভিষা',
    'পূর্বভাদ্রপদ',
    'উত্তরভাদ্রপদ',
    'রেবতী',
  ],
};

// ---------------------------------------------------------------------------
// Bhava, tithi, vara
// ---------------------------------------------------------------------------

const BHAVA: Names = {
  en: BHAVA_NAMES,
  hi: [
    'तनु',
    'धन',
    'सहज',
    'बंधु',
    'पुत्र',
    'अरि',
    'युवति',
    'रंध्र',
    'धर्म',
    'कर्म',
    'लाभ',
    'व्यय',
  ],
  bn: [
    'তনু',
    'ধন',
    'সহজ',
    'বন্ধু',
    'পুত্র',
    'অরি',
    'যুবতি',
    'রন্ধ্র',
    'ধর্ম',
    'কর্ম',
    'লাভ',
    'ব্যয়',
  ],
};

const TITHI: Names = {
  en: TITHI_NAMES,
  hi: [
    'प्रतिपदा',
    'द्वितीया',
    'तृतीया',
    'चतुर्थी',
    'पंचमी',
    'षष्ठी',
    'सप्तमी',
    'अष्टमी',
    'नवमी',
    'दशमी',
    'एकादशी',
    'द्वादशी',
    'त्रयोदशी',
    'चतुर्दशी',
  ],
  bn: [
    'প্রতিপদ',
    'দ্বিতীয়া',
    'তৃতীয়া',
    'চতুর্থী',
    'পঞ্চমী',
    'ষষ্ঠী',
    'সপ্তমী',
    'অষ্টমী',
    'নবমী',
    'দশমী',
    'একাদশী',
    'দ্বাদশী',
    'ত্রয়োদশী',
    'চতুর্দশী',
  ],
};

const VARA: Names = {
  en: VARA_NAMES_EN,
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'],
};

const PAKSHA: Record<Locale, { Shukla: string; Krishna: string }> = {
  en: { Shukla: 'Shukla', Krishna: 'Krishna' },
  hi: { Shukla: 'शुक्ल', Krishna: 'कृष्ण' },
  bn: { Shukla: 'শুক্ল', Krishna: 'কৃষ্ণ' },
};

// ---------------------------------------------------------------------------
// Dignity
// ---------------------------------------------------------------------------

const DIGNITY: Record<Locale, Record<Dignity, string>> = {
  en: DIGNITY_LABEL,
  hi: {
    exalted: 'उच्च',
    moolatrikona: 'मूलत्रिकोण',
    own: 'स्वगृही',
    great_friend: 'अधिमित्र',
    friend: 'मित्र',
    neutral: 'सम',
    enemy: 'शत्रु',
    great_enemy: 'अधिशत्रु',
    debilitated: 'नीच',
    none: '—',
  },
  bn: {
    exalted: 'উচ্চ',
    moolatrikona: 'মূলত্রিকোণ',
    own: 'স্বগৃহী',
    great_friend: 'অধিমিত্র',
    friend: 'মিত্র',
    neutral: 'সম',
    enemy: 'শত্রু',
    great_enemy: 'অধিশত্রু',
    debilitated: 'নীচ',
    none: '—',
  },
};

// ---------------------------------------------------------------------------

function pick(names: Names, locale: Locale, index: number): string {
  const list = names[locale] ?? names.en;
  return list[index] ?? names.en[index] ?? '';
}

export interface AstroNames {
  locale: Locale;
  rashi(index: number): string;
  graha(graha: AnyGraha): string;
  nakshatra(index: number): string;
  bhava(house: number): string;
  tithi(index: number): string;
  vara(index: number): string;
  paksha(value: 'Shukla' | 'Krishna'): string;
  dignity(value: Dignity): string;
  /** A list of graha names, joined for the reader's language. */
  grahaList(grahas: AnyGraha[]): string;
}

/**
 * The vocabulary for one locale.
 *
 * Returned as functions rather than as raw arrays so a caller cannot index a
 * list with the wrong base. Houses are 1 to 12 everywhere in this codebase
 * while the arrays are zero based, and that off-by-one has to live in exactly
 * one place.
 */
export function astroNames(locale: Locale): AstroNames {
  const grahaIndex = new Map(GRAHA_ORDER.map((g, i) => [g, i]));

  const graha = (g: AnyGraha) => {
    const index = grahaIndex.get(g);
    return index === undefined ? g : pick(GRAHA, locale, index);
  };

  return {
    locale,
    rashi: (index) => pick(RASHI, locale, index),
    graha,
    nakshatra: (index) => pick(NAKSHATRA, locale, index),
    bhava: (house) => pick(BHAVA, locale, house - 1),
    tithi: (index) => pick(TITHI, locale, index),
    vara: (index) => pick(VARA, locale, index),
    paksha: (value) => (PAKSHA[locale] ?? PAKSHA.en)[value],
    dignity: (value) => (DIGNITY[locale] ?? DIGNITY.en)[value] ?? value,
    grahaList: (grahas) => {
      const names = grahas.map(graha);
      if (names.length <= 1) return names[0] ?? '';
      const separator = locale === 'en' ? ' and ' : locale === 'hi' ? ' और ' : ' এবং ';
      return names.slice(0, -1).join(', ') + separator + names[names.length - 1];
    },
  };
}

export { RASHI, GRAHA, NAKSHATRA, BHAVA, TITHI, VARA, DIGNITY, GRAHA_ORDER };
