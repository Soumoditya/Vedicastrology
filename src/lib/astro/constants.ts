/**
 * Classical Jyotisha constants.
 *
 * Everything here is drawn from Brihat Parashara Hora Shastra and standard
 * Vedic practice. These values are deliberately written out in full rather than
 * derived, so they can be checked line by line against a text.
 */

// ---------------------------------------------------------------------------
// Rashis (signs)
// ---------------------------------------------------------------------------

export const RASHI_NAMES = [
  'Mesha',
  'Vrishabha',
  'Mithuna',
  'Karka',
  'Simha',
  'Kanya',
  'Tula',
  'Vrischika',
  'Dhanu',
  'Makara',
  'Kumbha',
  'Meena',
] as const;

export const RASHI_NAMES_EN = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export const RASHI_SYMBOLS = [
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
] as const;

export type RashiIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Elements in zodiacal order, repeating Fire → Earth → Air → Water. */
export const RASHI_ELEMENT = [
  'Fire',
  'Earth',
  'Air',
  'Water',
  'Fire',
  'Earth',
  'Air',
  'Water',
  'Fire',
  'Earth',
  'Air',
  'Water',
] as const;

/** Chara (movable), Sthira (fixed), Dvisvabhava (dual). */
export const RASHI_QUALITY = [
  'Chara',
  'Sthira',
  'Dvisvabhava',
  'Chara',
  'Sthira',
  'Dvisvabhava',
  'Chara',
  'Sthira',
  'Dvisvabhava',
  'Chara',
  'Sthira',
  'Dvisvabhava',
] as const;

/** Odd signs are male/cruel, even signs female/gentle. */
export const RASHI_GENDER = [
  'Male',
  'Female',
  'Male',
  'Female',
  'Male',
  'Female',
  'Male',
  'Female',
  'Male',
  'Female',
  'Male',
  'Female',
] as const;

/**
 * Rising style of each sign. Needed for Hora and several divisional charts.
 * Sirshodaya = rises head first, Prishtodaya = rises back first,
 * Ubhayodaya = both (Pisces alone).
 */
export const RASHI_RISING = [
  'Prishtodaya',
  'Prishtodaya',
  'Sirshodaya',
  'Prishtodaya',
  'Sirshodaya',
  'Sirshodaya',
  'Sirshodaya',
  'Sirshodaya',
  'Prishtodaya',
  'Prishtodaya',
  'Sirshodaya',
  'Ubhayodaya',
] as const;

// ---------------------------------------------------------------------------
// Grahas (planets)
// ---------------------------------------------------------------------------

export const GRAHAS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
] as const;

export type Graha = (typeof GRAHAS)[number];

/** Optional outer planets — not used in classical judgement, shown on request. */
export const OUTER_GRAHAS = ['Uranus', 'Neptune', 'Pluto'] as const;
export type OuterGraha = (typeof OUTER_GRAHAS)[number];

export type AnyGraha = Graha | OuterGraha;

export const GRAHA_NAMES_SA: Record<Graha, string> = {
  Sun: 'Surya',
  Moon: 'Chandra',
  Mars: 'Mangala',
  Mercury: 'Budha',
  Jupiter: 'Guru',
  Venus: 'Shukra',
  Saturn: 'Shani',
  Rahu: 'Rahu',
  Ketu: 'Ketu',
};

/** Short labels used inside chart cells, where space is tight. */
export const GRAHA_ABBR: Record<AnyGraha, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
  Uranus: 'Ur',
  Neptune: 'Ne',
  Pluto: 'Pl',
};

export const GRAHA_GLYPH: Record<AnyGraha, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

/**
 * Natural benefics and malefics.
 * Mercury is conditional (benefic alone, malefic with malefics) and the Moon is
 * conditional on paksha — both are resolved at runtime in `dignity.ts`, so the
 * value here is only the default classification.
 */
export const NATURAL_BENEFIC: Record<Graha, boolean> = {
  Sun: false,
  Moon: true,
  Mars: false,
  Mercury: true,
  Jupiter: true,
  Venus: true,
  Saturn: false,
  Rahu: false,
  Ketu: false,
};

/** Lord of each rashi, indexed by rashi. */
export const RASHI_LORD: Graha[] = [
  'Mars', // Mesha
  'Venus', // Vrishabha
  'Mercury', // Mithuna
  'Moon', // Karka
  'Sun', // Simha
  'Mercury', // Kanya
  'Venus', // Tula
  'Mars', // Vrischika
  'Jupiter', // Dhanu
  'Saturn', // Makara
  'Saturn', // Kumbha
  'Jupiter', // Meena
];

/** Signs each graha owns. Rahu and Ketu own none in the Parashari scheme. */
export const OWN_SIGNS: Record<Graha, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [],
  Ketu: [],
};

/**
 * Exaltation: deep exaltation point as absolute zodiac longitude (0–360).
 * Debilitation is exactly 180° opposite.
 *
 * Rahu and Ketu have no universally agreed exaltation. The most widely used
 * convention (and the one BPHS supports) places Rahu in Gemini and Ketu in
 * Sagittarius; some schools use Taurus/Scorpio. We follow Gemini/Sagittarius.
 */
export const EXALTATION_DEG: Record<Graha, number> = {
  Sun: 10, // Aries 10°
  Moon: 33, // Taurus 3°
  Mars: 298, // Capricorn 28°
  Mercury: 165, // Virgo 15°
  Jupiter: 95, // Cancer 5°
  Venus: 357, // Pisces 27°
  Saturn: 200, // Libra 20°
  Rahu: 80, // Gemini 20°
  Ketu: 260, // Sagittarius 20°
};

/** Moolatrikona ranges: [rashi, startDegInSign, endDegInSign]. */
export const MOOLATRIKONA: Record<Graha, [number, number, number] | null> = {
  Sun: [4, 0, 20], // Leo 0°–20°
  Moon: [1, 4, 20], // Taurus 4°–20°
  Mars: [0, 0, 12], // Aries 0°–12°
  Mercury: [5, 16, 20], // Virgo 16°–20°
  Jupiter: [8, 0, 10], // Sagittarius 0°–10°
  Venus: [6, 0, 15], // Libra 0°–15°
  Saturn: [10, 0, 20], // Aquarius 0°–20°
  Rahu: null,
  Ketu: null,
};

/**
 * Naisargika Maitri — natural, permanent friendship between grahas.
 * Rahu and Ketu are given the commonly used Parashari set.
 */
export const NATURAL_FRIENDS: Record<Graha, Graha[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
  Rahu: ['Venus', 'Saturn', 'Mercury'],
  Ketu: ['Mars', 'Venus', 'Saturn'],
};

export const NATURAL_ENEMIES: Record<Graha, Graha[]> = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
  Rahu: ['Sun', 'Moon', 'Mars'],
  Ketu: ['Sun', 'Moon'],
};

/**
 * Special aspects (graha drishti), counted in whole signs from the graha.
 * Every graha aspects the 7th. Mars, Jupiter and Saturn have extra aspects.
 * Rahu and Ketu are given 5/7/9 — widely used, though not universal.
 */
export const SPECIAL_ASPECTS: Record<Graha, number[]> = {
  Sun: [7],
  Moon: [7],
  Mars: [4, 7, 8],
  Mercury: [7],
  Jupiter: [5, 7, 9],
  Venus: [7],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

/**
 * Combustion (asta) orbs in degrees from the Sun.
 * Retrograde planets have tighter orbs, per classical usage.
 */
export const COMBUSTION_ORB: Record<
  Exclude<Graha, 'Sun' | 'Rahu' | 'Ketu'>,
  { direct: number; retrograde: number }
> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 },
};

// ---------------------------------------------------------------------------
// Nakshatras
// ---------------------------------------------------------------------------

export const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

/** Vimshottari dasha lord of each nakshatra, in order from Ashwini. */
export const NAKSHATRA_LORD: Graha[] = [
  'Ketu', // Ashwini
  'Venus', // Bharani
  'Sun', // Krittika
  'Moon', // Rohini
  'Mars', // Mrigashira
  'Rahu', // Ardra
  'Jupiter', // Punarvasu
  'Saturn', // Pushya
  'Mercury', // Ashlesha
  'Ketu', // Magha
  'Venus', // Purva Phalguni
  'Sun', // Uttara Phalguni
  'Moon', // Hasta
  'Mars', // Chitra
  'Rahu', // Swati
  'Jupiter', // Vishakha
  'Saturn', // Anuradha
  'Mercury', // Jyeshtha
  'Ketu', // Mula
  'Venus', // Purva Ashadha
  'Sun', // Uttara Ashadha
  'Moon', // Shravana
  'Mars', // Dhanishta
  'Rahu', // Shatabhisha
  'Jupiter', // Purva Bhadrapada
  'Saturn', // Uttara Bhadrapada
  'Mercury', // Revati
];

export const NAKSHATRA_DEITY = [
  'Ashwini Kumaras',
  'Yama',
  'Agni',
  'Brahma',
  'Soma',
  'Rudra',
  'Aditi',
  'Brihaspati',
  'Sarpas',
  'Pitris',
  'Bhaga',
  'Aryaman',
  'Savitr',
  'Tvashtar',
  'Vayu',
  'Indra-Agni',
  'Mitra',
  'Indra',
  'Nirriti',
  'Apas',
  'Vishvadevas',
  'Vishnu',
  'Vasus',
  'Varuna',
  'Aja Ekapada',
  'Ahir Budhnya',
  'Pushan',
] as const;

export const NAKSHATRA_SYMBOL = [
  "Horse's head",
  'Yoni',
  'Razor',
  'Cart',
  "Deer's head",
  'Teardrop',
  'Quiver of arrows',
  'Cow udder',
  'Coiled serpent',
  'Royal throne',
  'Front legs of a cot',
  'Rear legs of a cot',
  'Hand',
  'Bright jewel',
  'Young shoot in wind',
  'Triumphal arch',
  'Lotus',
  'Circular amulet',
  'Bunch of roots',
  'Elephant tusk',
  'Elephant tusk',
  'Three footprints',
  'Drum',
  'Empty circle',
  'Front of a funeral cot',
  'Rear of a funeral cot',
  'Fish',
] as const;

/** Gana — temperament grouping, used in Guna Milan. */
export const NAKSHATRA_GANA = [
  'Deva',
  'Manushya',
  'Rakshasa',
  'Manushya',
  'Deva',
  'Manushya',
  'Deva',
  'Deva',
  'Rakshasa',
  'Rakshasa',
  'Manushya',
  'Manushya',
  'Deva',
  'Rakshasa',
  'Deva',
  'Rakshasa',
  'Deva',
  'Rakshasa',
  'Rakshasa',
  'Manushya',
  'Manushya',
  'Deva',
  'Rakshasa',
  'Rakshasa',
  'Manushya',
  'Manushya',
  'Deva',
] as const;

/** Yoni — animal symbol, used in Guna Milan. */
export const NAKSHATRA_YONI = [
  'Horse',
  'Elephant',
  'Sheep',
  'Serpent',
  'Serpent',
  'Dog',
  'Cat',
  'Sheep',
  'Cat',
  'Rat',
  'Rat',
  'Cow',
  'Buffalo',
  'Tiger',
  'Buffalo',
  'Tiger',
  'Deer',
  'Deer',
  'Dog',
  'Monkey',
  'Mongoose',
  'Monkey',
  'Lion',
  'Horse',
  'Lion',
  'Cow',
  'Elephant',
] as const;

/** Nadi — constitutional grouping, the highest-weighted koot in Guna Milan. */
export const NAKSHATRA_NADI = [
  'Adi',
  'Madhya',
  'Antya',
  'Antya',
  'Madhya',
  'Adi',
  'Adi',
  'Madhya',
  'Antya',
  'Antya',
  'Madhya',
  'Adi',
  'Adi',
  'Madhya',
  'Antya',
  'Antya',
  'Madhya',
  'Adi',
  'Adi',
  'Madhya',
  'Antya',
  'Antya',
  'Madhya',
  'Adi',
  'Adi',
  'Madhya',
  'Antya',
] as const;

// ---------------------------------------------------------------------------
// Vimshottari dasha
// ---------------------------------------------------------------------------

/** Dasha lords in Vimshottari order, with their period lengths in years. */
export const VIMSHOTTARI_ORDER: Graha[] = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];

export const VIMSHOTTARI_YEARS: Record<Graha, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

export const VIMSHOTTARI_TOTAL_YEARS = 120;

/**
 * The Vimshottari year is a solar year of 365.25 days.
 * Using 365.2425 or 365.2422 here shifts long dasha boundaries by days, which
 * is why standard software (and this engine) uses exactly 365.25.
 */
export const VIMSHOTTARI_YEAR_DAYS = 365.25;

// ---------------------------------------------------------------------------
// Panchang
// ---------------------------------------------------------------------------

export const TITHI_NAMES = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
] as const;

export const KARANA_NAMES = [
  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Gara',
  'Vanija',
  'Vishti',
] as const;

export const FIXED_KARANA_NAMES = ['Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'] as const;

export const YOGA_NAMES = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shula',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyana',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti',
] as const;

export const VARA_NAMES = [
  'Ravivara',
  'Somavara',
  'Mangalavara',
  'Budhavara',
  'Guruvara',
  'Shukravara',
  'Shanivara',
] as const;

export const VARA_NAMES_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Lord of each weekday, indexed the same as VARA_NAMES (0 = Sunday). */
export const VARA_LORD: Graha[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

/** Order used for the planetary hour (hora) cycle. */
export const HORA_ORDER: Graha[] = [
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
  'Saturn',
  'Jupiter',
  'Mars',
];

// ---------------------------------------------------------------------------
// Bhavas (houses)
// ---------------------------------------------------------------------------

export const BHAVA_NAMES = [
  'Tanu',
  'Dhana',
  'Sahaja',
  'Bandhu',
  'Putra',
  'Ari',
  'Yuvati',
  'Randhra',
  'Dharma',
  'Karma',
  'Labha',
  'Vyaya',
] as const;

export const BHAVA_SIGNIFICATIONS = [
  'Self, body, appearance, vitality, temperament',
  'Wealth, family, speech, accumulated resources, food',
  'Siblings, courage, initiative, short travel, skill of hand',
  'Mother, home, land, vehicles, inner peace, education',
  'Children, intellect, creativity, past merit, romance',
  'Illness, debt, enemies, obstacles, service, daily work',
  'Marriage, partnership, contracts, public dealings',
  'Longevity, upheaval, hidden matters, inheritance, occult',
  'Fortune, dharma, father, higher learning, long travel, guru',
  'Career, status, action in the world, authority',
  'Gains, income, networks, elder siblings, fulfilment of desire',
  'Loss, expenditure, foreign lands, liberation, sleep',
] as const;

/** Kendra (angular) houses — 1, 4, 7, 10 as zero-based indices. */
export const KENDRA_HOUSES = [0, 3, 6, 9];
/** Trikona (trine) houses — 1, 5, 9. */
export const TRIKONA_HOUSES = [0, 4, 8];
/** Dusthana (difficult) houses — 6, 8, 12. */
export const DUSTHANA_HOUSES = [5, 7, 11];
/** Upachaya (growing) houses — 3, 6, 10, 11. */
export const UPACHAYA_HOUSES = [2, 5, 9, 10];
/** Maraka (death-inflicting) houses — 2, 7. */
export const MARAKA_HOUSES = [1, 6];
