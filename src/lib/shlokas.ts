/**
 * Sanskrit verses used through the site.
 *
 * Every one is a real verse from a named source, checked against the tradition
 * rather than invented, and carries its Devanagari, a transliteration and a
 * plain translation. A site about Jyotish that put fabricated Sanskrit on the
 * page would be undermining its own whole pitch, which is that the working is
 * shown and can be checked.
 *
 * The Devanagari renders in Noto Sans Devanagari, which the layout already
 * loads, so it is legible in every language mode rather than falling back to
 * tofu on a device without the script.
 */

export interface Shloka {
  key: string;
  /** Devanagari. */
  sanskrit: string;
  /** IAST-ish transliteration, readable without diacritic training. */
  transliteration: string;
  translation: string;
  source: string;
}

export const SHLOKAS: Record<string, Shloka> = {
  /*
    The Ganesha invocation. Traditionally spoken before beginning any
    undertaking, which is exactly what casting a chart is, so it opens the site.
  */
  ganesha: {
    key: 'ganesha',
    sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    transliteration:
      'vakratuṇḍa mahākāya sūryakoṭi samaprabha,\nnirvighnaṃ kuru me deva sarvakāryeṣu sarvadā',
    translation:
      'O Lord of the curved trunk and great form, radiant as a million suns, ' +
      'let my every undertaking be free of obstacles, always.',
    source: 'Ganesha invocation',
  },

  /*
    "Lead me from darkness to light." Jyotish means the science of light, so
    this verse is the site's own thesis in four words, and it is a real
    Upanishadic mantra rather than a slogan.
  */
  jyoti: {
    key: 'jyoti',
    sanskrit:
      'ॐ असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ॥',
    transliteration:
      'oṃ asato mā sadgamaya,\ntamaso mā jyotirgamaya,\nmṛtyormā amṛtaṃ gamaya',
    translation:
      'Lead me from the unreal to the real, from darkness to light, from death ' +
      'to what does not die.',
    source: 'Bṛhadāraṇyaka Upaniṣad 1.3.28',
  },
};

/** Ordered, for anywhere that wants to show more than one. */
export const SHLOKA_LIST = Object.values(SHLOKAS);
