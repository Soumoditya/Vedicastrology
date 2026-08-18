import type { Locale } from './locales';

/**
 * The interface dictionary.
 *
 * Flat keys, grouped by area with a dotted prefix, because a nested object
 * looks tidier and is worse to work with: a missing branch throws instead of
 * falling back, and comparing three languages side by side is harder.
 *
 * English is the source of truth. `hi` and `bn` may be incomplete without
 * breaking anything, since a missing key falls back to English rather than
 * rendering blank.
 */

export type Dictionary = Record<string, string>;

const en: Dictionary = {
  // Tool names and descriptions, keyed by feature so a page needs no mapping.
  'tool.kundli.label': 'Birth Chart',
  'tool.panchang.label': 'Panchang',
  'tool.dasha.label': 'Dasha Periods',
  'tool.transits.label': 'Transits',
  'tool.matching.label': 'Compatibility',
  'tool.yogas.label': 'Yogas and Doshas',
  'tool.remedies.label': 'Remedies',
  'tool.nakshatra.label': 'Nakshatra Finder',

  'tool.kundli.description':
    'Your complete Vedic chart with houses, nakshatras, dignities and all sixteen divisional charts.',
  'tool.panchang.description':
    'Today’s tithi, nakshatra, yoga and karana with true sunrise, Rahu Kaal and auspicious windows.',
  'tool.dasha.description':
    'Your planetary periods to four levels, with the exact dates each one begins and ends.',
  'tool.transits.description':
    'Where the grahas are now relative to your chart, including Sade Sati and its phases.',
  'tool.matching.description':
    'Ashtakoot matching across all eight koots, with Mangal dosha and its cancellations.',
  'tool.yogas.description':
    'Every combination your chart forms with the reason it was found, plus Manglik, Kalsarpa and Ashtakavarga.',
  'tool.remedies.description':
    'The traditional measures for whichever grahas your chart shows as needing support, with an honest note on gemstones.',
  'tool.nakshatra.description':
    'Your birth star, its pada, ruling graha and what the classical texts say about it.',


  // Navigation and chrome
  'nav.tools': 'Free Tools',
  'nav.services': 'Consultations',
  'nav.journal': 'Journal',
  'nav.about': 'About',
  'nav.book': 'Book a reading',
  'nav.signIn': 'Sign in',
  'nav.signInLong': 'Sign in or create an account',
  'nav.charts': 'Your charts',
  'nav.settings': 'Settings',
  'nav.admin': 'Admin panel',
  'nav.signOut': 'Sign out',
  'nav.account': 'Your account',
  'nav.menuOpen': 'Open menu',
  'nav.menuClose': 'Close menu',

  // Tools index
  'tools.eyebrow': 'Free tools',
  'tools.heading': 'Study your own chart',
  'tools.intro':
    'These run the same calculations I use in a paid reading. They are free ' +
    'because a chart you can check for yourself is worth more than one you are ' +
    'asked to take on trust. Nothing here needs an account.',
  'tools.open': 'Open',
  'tools.membersBadge': 'Members',
  'tools.accountBadge': 'Account',

  // Shared chart wording
  'chart.sameChartElsewhere': 'Same chart, elsewhere',
  'chart.savedChart': 'Your saved chart',
  'chart.savedCharts': 'Your saved charts',
  'chart.orEnterDetails': 'Or enter different details below.',
  'chart.downloadPdf': 'Download as PDF',
  'chart.anotherChart': 'Another chart',
  'chart.northIndian': 'North',
  'chart.southIndian': 'South',
  'chart.chartStyle': 'Chart style',
  'chart.ascendant': 'Ascendant',
  'chart.moonSign': 'Moon sign',
  'chart.nakshatra': 'Nakshatra',
  'chart.currentDasha': 'Current dasha',
  'chart.house': 'House',
  'chart.sign': 'Sign',
  'chart.lord': 'Lord',
  'chart.occupiedBy': 'Occupied by',
  'chart.aspectedBy': 'Aspected by',
  'chart.none': 'None',
  'chart.retrograde': 'Retrograde, moving backward',
  'chart.benefic': 'Benefic for this chart',
  'chart.malefic': 'Malefic for this chart',
  'chart.neutral': 'Neutral',

  // Birth form
  'form.name': 'Name',
  'form.optional': 'Optional',
  'form.whoseChart': 'Whose chart is this?',
  'form.dateOfBirth': 'Date of birth',
  'form.timeOfBirth': 'Time of birth',
  'form.clock24': '24-hour clock',
  'form.timeUnknown': 'I don’t know the time of birth',
  'form.timeUnknownNote':
    'The chart is still cast, but the ascendant, houses and dasha dates cannot ' +
    'be relied on, everything affected is marked.',
  'form.placeOfBirth': 'Place of birth',
  'form.placeHint': 'Start typing a city',
  'form.cityOfBirth': 'City of birth',
  'form.submitChart': 'Cast the chart',
  'form.required': 'Please fill this in.',

  // Yogas
  'yogas.eyebrow': 'Yoga, Doṣa, Aṣṭakavarga',
  'yogas.whatForms': 'What forms',
  'yogas.mangalDosha': 'Mangal doṣa',
  'yogas.otherAfflictions': 'Other afflictions',
  'yogas.kalasarpa': 'Kālasarpa',
  'yogas.ashtakavarga': 'Aṣṭakavarga',
  'yogas.strongest': 'Strongest',
  'yogas.weakest': 'Weakest',
  'yogas.total': 'Total',
  'yogas.manglik': 'Manglik',
  'yogas.notManglik': 'Not Manglik',
  'yogas.manglikCancelled': 'Manglik, but cancelled',
  'yogas.noKalsarpa': 'No Kalsarpa',
  'yogas.yoga': 'yoga',
  'yogas.yogaPlural': 'yogas',
  'yogas.affliction': 'affliction',
  'yogas.afflictionPlural': 'afflictions',

  // Readings
  'readings.title': 'Readings',
  'readings.today': 'Today',
  'readings.thisWeek': 'This week',
  'readings.thisMonth': 'This month',
  'readings.thisYear': 'This year',
  'readings.whatEngineFound': 'What the engine found',
  'readings.whereThisStands': 'Where this stands',
  'readings.awaitingReview':
    'This reading is written and waiting to be read over before it is released. ' +
    'Longer readings are always checked by hand. The findings it was built from ' +
    'are below in the meantime, and they do not change.',
  'readings.disclaimer':
    'A reading describes tendencies, not certainties, and it is not a ' +
    'substitute for medical, legal or financial advice. Where something here ' +
    'touches your health, a doctor is the person to ask.',

  // Remedies
  'remedies.eyebrow': 'Upāya',
  'remedies.conduct': 'Conduct',
  'remedies.charity': 'Charity',
  'remedies.fasting': 'Fasting',
  'remedies.mantra': 'Mantra',
  'remedies.gemstone': 'Gemstone',

  // Gates
  'gate.needsAccount': 'This one needs an account. It is free to make and takes a moment.',
  'gate.needsPremium': 'This is part of membership.',
  'gate.disabled': 'This is turned off for now. It will be back.',
  'gate.unavailable': 'This is not available.',
  'gate.createAccount': 'Create an account',
  'gate.backToTools': 'Back to the free tools',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.save': 'Save settings',
  'settings.saved': 'Settings saved.',

  // Added with the strings that now read through the dictionary.
  'step.kundli': 'Your chart',
  'step.nakshatra': 'Your star',
  'step.dasha': 'What is running',
  'step.yogas': 'What it forms',
  'step.transits': 'What is coming',
  'step.remedies': 'What helps',
  'step.matching': 'With another',
  'rail.aria': 'Where to go with this chart',
  'rail.path': 'The path through a chart',
  'rail.checks': 'Specific checks',
  'rail.fullReport': 'Full Kundali Report',
  'rail.of': 'of',
  'pager.aria': 'Move through the chart',
  'pager.back': 'Back',
  'pager.next': 'Next',
  'form.genderLegend': 'Gender',
  'form.genderFemale': 'Female',
  'form.genderMale': 'Male',
  'form.genderUndisclosed': 'Prefer not to say',
  'form.genderNote': 'Used only where a classical rule needs it: comparing two charts counts some of the eight koots from the bride’s chart to the groom’s. Nothing else in your chart depends on it.',
  'form.errDate': 'Please enter the date of birth.',
  'form.errPlace': 'Please choose the place of birth from the list.',
  'form.errTime': 'Please enter the time of birth, or tick “I don’t know the time”.',
  'form.errGender': 'Please choose one of the three options under Gender.',
  'form.calculating': 'Calculating…',
  'form.searching': 'searching…',

  // Chart legend and workspace.
  'legend.retrograde':
    'Retrograde, moving backward',
  'legend.rashisNotHouses':
    'are rashis, not houses',
  'legend.hide':
    'Hide',
  'legend.how':
    'How do I read this chart?',
  'legend.north1':
    'The houses never move. The diamond at the top is always the first house, and the count runs anticlockwise from there. This is the opposite of the South Indian style, where the signs stay put and the houses move.',
  'legend.north2':
    'The number written in each house is the rashi sitting in it. 1 is Aries and 12 is Pisces. So if the top diamond holds a 7, your ascendant is Libra.',
  'legend.south':
    'The signs never move. Aries is always the second box on the top row and the order runs clockwise. The house numbers shift depending on where your ascendant falls.',
  'legend.grahas':
    'The two letter labels are the grahas. Su is the Sun, Mo the Moon, Ma Mars, Me Mercury, Ju Jupiter, Ve Venus, Sa Saturn, Ra Rahu and Ke Ketu. The small number beside each one is its degree within that sign.',
  'legend.strength':
    'Whether a graha helps or troubles you depends on your ascendant, not on its general reputation, so it is stated in words in the table below rather than by colour on the chart. A natural malefic ruling a good house can be the best graha you have.',
  'legend.crowded':
    'In a crowded house the degrees are hidden and the labels move to two columns, so nothing spills outside its own house.',
  'chart.readingTheChart':
    'Reading the chart',
  'chart.selectHouse':
    'Select any house to see its sign, its lord, which grahas sit there and which aspect it.',
};

const hi: Dictionary = {
  'nav.tools': 'निःशुल्क साधन',
  'nav.services': 'परामर्श',
  'nav.journal': 'लेख',
  'nav.about': 'परिचय',
  'nav.book': 'परामर्श बुक करें',
  'nav.signIn': 'साइन इन',
  'nav.signInLong': 'साइन इन करें या खाता बनाएँ',
  'nav.charts': 'आपकी कुंडलियाँ',
  'nav.settings': 'सेटिंग्स',
  'nav.admin': 'व्यवस्थापन',
  'nav.signOut': 'साइन आउट',
  'nav.account': 'आपका खाता',
  'nav.menuOpen': 'मेनू खोलें',
  'nav.menuClose': 'मेनू बंद करें',

  'tools.eyebrow': 'निःशुल्क साधन',
  'tools.heading': 'अपनी कुंडली स्वयं देखें',
  'tools.intro':
    'यहाँ वही गणनाएँ चलती हैं जो सशुल्क परामर्श में प्रयोग होती हैं। ये निःशुल्क ' +
    'हैं क्योंकि जिस कुंडली को आप स्वयं जाँच सकें, वह उस कुंडली से अधिक मूल्यवान है ' +
    'जिसे केवल विश्वास पर मानना पड़े। किसी खाते की आवश्यकता नहीं।',
  'tools.open': 'खोलें',
  'tools.membersBadge': 'सदस्य',
  'tools.accountBadge': 'खाता',

  'chart.sameChartElsewhere': 'यही कुंडली, अन्य साधनों में',
  'chart.savedChart': 'आपकी सुरक्षित कुंडली',
  'chart.savedCharts': 'आपकी सुरक्षित कुंडलियाँ',
  'chart.orEnterDetails': 'या नीचे अन्य विवरण भरें।',
  'chart.downloadPdf': 'PDF डाउनलोड करें',
  'chart.anotherChart': 'दूसरी कुंडली',
  'chart.northIndian': 'उत्तर',
  'chart.southIndian': 'दक्षिण',
  'chart.chartStyle': 'कुंडली शैली',
  'chart.ascendant': 'लग्न',
  'chart.moonSign': 'चंद्र राशि',
  'chart.nakshatra': 'नक्षत्र',
  'chart.currentDasha': 'वर्तमान दशा',
  'chart.house': 'भाव',
  'chart.sign': 'राशि',
  'chart.lord': 'स्वामी',
  'chart.occupiedBy': 'स्थित ग्रह',
  'chart.aspectedBy': 'दृष्टि',
  'chart.none': 'कोई नहीं',
  'chart.retrograde': 'वक्री, पीछे की ओर गतिमान',
  'chart.benefic': 'इस कुंडली में शुभ',
  'chart.malefic': 'इस कुंडली में अशुभ',
  'chart.neutral': 'सम',

  'form.name': 'नाम',
  'form.optional': 'वैकल्पिक',
  'form.whoseChart': 'यह कुंडली किसकी है?',
  'form.dateOfBirth': 'जन्म तिथि',
  'form.timeOfBirth': 'जन्म समय',
  'form.clock24': '24 घंटे की घड़ी',
  'form.timeUnknown': 'मुझे जन्म समय ज्ञात नहीं है',
  'form.timeUnknownNote':
    'कुंडली फिर भी बनेगी, परंतु लग्न, भाव और दशा की तिथियाँ विश्वसनीय नहीं होंगी। ' +
    'जो भी प्रभावित है, वह चिह्नित कर दिया गया है।',
  'form.placeOfBirth': 'जन्म स्थान',
  'form.placeHint': 'नगर का नाम लिखना आरंभ करें',
  'form.cityOfBirth': 'जन्म नगर',
  'form.submitChart': 'कुंडली बनाएँ',
  'form.required': 'कृपया यह भरें।',

  'yogas.eyebrow': 'योग, दोष, अष्टकवर्ग',
  'yogas.whatForms': 'कौन से योग बनते हैं',
  'yogas.mangalDosha': 'मंगल दोष',
  'yogas.otherAfflictions': 'अन्य दोष',
  'yogas.kalasarpa': 'कालसर्प',
  'yogas.ashtakavarga': 'अष्टकवर्ग',
  'yogas.strongest': 'सर्वाधिक बल',
  'yogas.weakest': 'न्यूनतम बल',
  'yogas.total': 'कुल',
  'yogas.manglik': 'मांगलिक',
  'yogas.notManglik': 'मांगलिक नहीं',
  'yogas.manglikCancelled': 'मांगलिक, परंतु दोष भंग',
  'yogas.noKalsarpa': 'कालसर्प नहीं',
  'yogas.yoga': 'योग',
  'yogas.yogaPlural': 'योग',
  'yogas.affliction': 'दोष',
  'yogas.afflictionPlural': 'दोष',

  'readings.title': 'फलादेश',
  'readings.today': 'आज',
  'readings.thisWeek': 'यह सप्ताह',
  'readings.thisMonth': 'यह माह',
  'readings.thisYear': 'यह वर्ष',
  'readings.whatEngineFound': 'गणना में जो मिला',
  'readings.whereThisStands': 'वर्तमान स्थिति',
  'readings.awaitingReview':
    'यह फलादेश लिखा जा चुका है और प्रकाशित होने से पहले पढ़े जाने की प्रतीक्षा में ' +
    'है। बड़े फलादेश सदैव स्वयं जाँचे जाते हैं। जिन आधारों पर यह बना है, वे नीचे ' +
    'दिए हैं और वे बदलते नहीं।',
  'readings.disclaimer':
    'फलादेश प्रवृत्तियाँ बताता है, निश्चितताएँ नहीं, और यह चिकित्सा, विधि अथवा ' +
    'वित्तीय सलाह का विकल्प नहीं है। जहाँ बात स्वास्थ्य की हो, वहाँ चिकित्सक से ' +
    'पूछना उचित है।',

  'remedies.eyebrow': 'उपाय',
  'remedies.conduct': 'आचरण',
  'remedies.charity': 'दान',
  'remedies.fasting': 'व्रत',
  'remedies.mantra': 'मंत्र',
  'remedies.gemstone': 'रत्न',

  'gate.needsAccount': 'इसके लिए खाता आवश्यक है। बनाना निःशुल्क है और क्षण भर का काम है।',
  'gate.needsPremium': 'यह सदस्यता का भाग है।',
  'gate.disabled': 'यह अभी बंद है। पुनः उपलब्ध होगा।',
  'gate.unavailable': 'यह उपलब्ध नहीं है।',
  'gate.createAccount': 'खाता बनाएँ',
  'gate.backToTools': 'निःशुल्क साधनों पर वापस',

  'settings.title': 'सेटिंग्स',
  'settings.language': 'भाषा',
  'settings.theme': 'रूप',
  'settings.save': 'सेटिंग्स सुरक्षित करें',
  'settings.saved': 'सेटिंग्स सुरक्षित हो गईं।',

  'tool.kundli.label': 'जन्म कुंडली',
  'tool.panchang.label': 'पंचांग',
  'tool.dasha.label': 'दशा काल',
  'tool.transits.label': 'गोचर',
  'tool.matching.label': 'गुण मिलान',
  'tool.yogas.label': 'योग और दोष',
  'tool.remedies.label': 'उपाय',
  'tool.nakshatra.label': 'नक्षत्र खोज',

  'tool.kundli.description': 'भाव, नक्षत्र, ग्रह-बल और सोलह वर्ग कुंडलियों सहित पूर्ण वैदिक कुंडली।',
  'tool.panchang.description': 'आज की तिथि, नक्षत्र, योग और करण, वास्तविक सूर्योदय, राहु काल तथा शुभ मुहूर्त के साथ।',
  'tool.dasha.description': 'आपकी दशाएँ चार स्तरों तक, प्रत्येक के आरंभ और समाप्ति की सटीक तिथियों के साथ।',
  'tool.transits.description': 'आपकी कुंडली के सापेक्ष ग्रहों की वर्तमान स्थिति, साढ़े साती और उसके चरणों सहित।',
  'tool.matching.description': 'आठों कूटों पर अष्टकूट मिलान, मंगल दोष और उसके भंग के साथ।',
  'tool.yogas.description': 'आपकी कुंडली में बनने वाला प्रत्येक योग, उसके कारण सहित, तथा मांगलिक, कालसर्प और अष्टकवर्ग।',
  'tool.remedies.description': 'जिन ग्रहों को बल की आवश्यकता है उनके पारंपरिक उपाय, रत्नों पर स्पष्ट टिप्पणी सहित।',
  'tool.nakshatra.description': 'आपका जन्म नक्षत्र, पाद, स्वामी ग्रह और शास्त्रों में उसका वर्णन।',

  // Added with the strings that now read through the dictionary.
  'step.kundli': 'आपकी कुंडली',
  'step.nakshatra': 'आपका नक्षत्र',
  'step.dasha': 'क्या चल रहा है',
  'step.yogas': 'क्या बनता है',
  'step.transits': 'क्या आ रहा है',
  'step.remedies': 'क्या सहायक है',
  'step.matching': 'किसी और के साथ',
  'rail.aria': 'इस कुंडली के साथ कहाँ जाएँ',
  'rail.path': 'कुंडली पढ़ने का क्रम',
  'rail.checks': 'विशेष जाँच',
  'rail.fullReport': 'सम्पूर्ण कुंडली रिपोर्ट',
  'rail.of': 'में से',
  'pager.aria': 'कुंडली में आगे-पीछे जाएँ',
  'pager.back': 'पीछे',
  'pager.next': 'आगे',
  'form.genderLegend': 'लिंग',
  'form.genderFemale': 'स्त्री',
  'form.genderMale': 'पुरुष',
  'form.genderUndisclosed': 'बताना नहीं चाहते',
  'form.genderNote': 'केवल वहाँ प्रयोग होता है जहाँ शास्त्रीय नियम माँगता है: दो कुंडलियों के मिलान में आठ कूटों में से कुछ वर-वधू के क्रम से गिने जाते हैं। कुंडली में और कुछ इस पर निर्भर नहीं है।',
  'form.errDate': 'कृपया जन्म तिथि भरें।',
  'form.errPlace': 'कृपया सूची से जन्म स्थान चुनें।',
  'form.errTime': 'कृपया जन्म समय भरें, या “मुझे जन्म समय ज्ञात नहीं है” चुनें।',
  'form.errGender': 'कृपया लिंग के तीन विकल्पों में से एक चुनें।',
  'form.calculating': 'गणना हो रही है…',
  'form.searching': 'खोज रहे हैं…',

  // Chart legend and workspace.
  'legend.retrograde':
    'वक्री, पीछे चलता हुआ',
  'legend.rashisNotHouses':
    'राशियाँ हैं, भाव नहीं',
  'legend.hide':
    'छिपाएँ',
  'legend.how':
    'यह कुंडली कैसे पढ़ें?',
  'legend.north1':
    'भाव कभी नहीं बदलते। ऊपर का केंद्रीय खंड सदा प्रथम भाव है, और गणना वहाँ से वामावर्त चलती है। यह दक्षिण भारतीय शैली के विपरीत है, जहाँ राशियाँ स्थिर रहती हैं और भाव बदलते हैं।',
  'legend.north2':
    'प्रत्येक भाव में लिखा अंक उसमें बैठी राशि है। 1 मेष और 12 मीन है। इसलिए यदि ऊपर के खंड में 7 है, तो आपका लग्न तुला है।',
  'legend.south':
    'राशियाँ कभी नहीं बदलतीं। मेष सदा ऊपरी पंक्ति का दूसरा खंड है और क्रम दक्षिणावर्त चलता है। भाव संख्याएँ आपके लग्न के अनुसार बदलती हैं।',
  'legend.grahas':
    'दो अक्षरों के चिह्न ग्रह हैं। Su सूर्य, Mo चन्द्र, Ma मंगल, Me बुध, Ju गुरु, Ve शुक्र, Sa शनि, Ra राहु और Ke केतु। साथ का छोटा अंक उस राशि में उसका अंश है।',
  'legend.strength':
    'कोई ग्रह आपके लिए शुभ है या अशुभ, यह आपके लग्न पर निर्भर करता है, उसकी सामान्य प्रतिष्ठा पर नहीं। इसलिए यह कुंडली पर रंग से नहीं, नीचे की तालिका में शब्दों में बताया गया है। शुभ भाव का स्वामी पापग्रह आपकी कुंडली का सर्वोत्तम ग्रह हो सकता है।',
  'legend.crowded':
    'भरे हुए भाव में अंश छिपा दिए जाते हैं और चिह्न दो स्तंभों में आ जाते हैं, जिससे कुछ भी अपने भाव से बाहर न जाए।',
  'chart.readingTheChart':
    'कुंडली पढ़ना',
  'chart.selectHouse':
    'किसी भी भाव को चुनें और देखें उसकी राशि, स्वामी, उसमें बैठे ग्रह और उस पर दृष्टि डालने वाले ग्रह।',
};

const bn: Dictionary = {
  'nav.tools': 'বিনামূল্যের সরঞ্জাম',
  'nav.services': 'পরামর্শ',
  'nav.journal': 'লেখা',
  'nav.about': 'পরিচিতি',
  'nav.book': 'পরামর্শ বুক করুন',
  'nav.signIn': 'সাইন ইন',
  'nav.signInLong': 'সাইন ইন করুন বা অ্যাকাউন্ট তৈরি করুন',
  'nav.charts': 'আপনার কুণ্ডলী',
  'nav.settings': 'সেটিংস',
  'nav.admin': 'প্রশাসন',
  'nav.signOut': 'সাইন আউট',
  'nav.account': 'আপনার অ্যাকাউন্ট',
  'nav.menuOpen': 'মেনু খুলুন',
  'nav.menuClose': 'মেনু বন্ধ করুন',

  'tools.eyebrow': 'বিনামূল্যের সরঞ্জাম',
  'tools.heading': 'নিজের কুণ্ডলী নিজেই দেখুন',
  'tools.intro':
    'এখানে সেই একই গণনা চলে যা সশুল্ক পরামর্শে ব্যবহৃত হয়। এগুলি বিনামূল্যে, ' +
    'কারণ যে কুণ্ডলী আপনি নিজে যাচাই করতে পারেন তা কেবল বিশ্বাসে মেনে নেওয়া ' +
    'কুণ্ডলীর চেয়ে বেশি মূল্যবান। কোনও অ্যাকাউন্টের প্রয়োজন নেই।',
  'tools.open': 'খুলুন',
  'tools.membersBadge': 'সদস্য',
  'tools.accountBadge': 'অ্যাকাউন্ট',

  'chart.sameChartElsewhere': 'একই কুণ্ডলী, অন্য সরঞ্জামে',
  'chart.savedChart': 'আপনার সংরক্ষিত কুণ্ডলী',
  'chart.savedCharts': 'আপনার সংরক্ষিত কুণ্ডলীগুলি',
  'chart.orEnterDetails': 'অথবা নীচে অন্য বিবরণ দিন।',
  'chart.downloadPdf': 'PDF ডাউনলোড করুন',
  'chart.anotherChart': 'অন্য কুণ্ডলী',
  'chart.northIndian': 'উত্তর',
  'chart.southIndian': 'দক্ষিণ',
  'chart.chartStyle': 'কুণ্ডলীর ধরন',
  'chart.ascendant': 'লগ্ন',
  'chart.moonSign': 'চন্দ্র রাশি',
  'chart.nakshatra': 'নক্ষত্র',
  'chart.currentDasha': 'বর্তমান দশা',
  'chart.house': 'ভাব',
  'chart.sign': 'রাশি',
  'chart.lord': 'অধিপতি',
  'chart.occupiedBy': 'অবস্থিত গ্রহ',
  'chart.aspectedBy': 'দৃষ্টি',
  'chart.none': 'কিছু নেই',
  'chart.retrograde': 'বক্রী, পিছনের দিকে গতিশীল',
  'chart.benefic': 'এই কুণ্ডলীতে শুভ',
  'chart.malefic': 'এই কুণ্ডলীতে অশুভ',
  'chart.neutral': 'সম',

  'form.name': 'নাম',
  'form.optional': 'ঐচ্ছিক',
  'form.whoseChart': 'এটি কার কুণ্ডলী?',
  'form.dateOfBirth': 'জন্ম তারিখ',
  'form.timeOfBirth': 'জন্ম সময়',
  'form.clock24': '২৪ ঘণ্টার ঘড়ি',
  'form.timeUnknown': 'আমি জন্ম সময় জানি না',
  'form.timeUnknownNote':
    'কুণ্ডলী তবুও তৈরি হবে, তবে লগ্ন, ভাব এবং দশার তারিখ নির্ভরযোগ্য হবে না। ' +
    'যা যা প্রভাবিত, তা চিহ্নিত করা আছে।',
  'form.placeOfBirth': 'জন্মস্থান',
  'form.placeHint': 'শহরের নাম লিখতে শুরু করুন',
  'form.cityOfBirth': 'জন্ম শহর',
  'form.submitChart': 'কুণ্ডলী তৈরি করুন',
  'form.required': 'অনুগ্রহ করে এটি পূরণ করুন।',

  'yogas.eyebrow': 'যোগ, দোষ, অষ্টকবর্গ',
  'yogas.whatForms': 'কোন যোগ তৈরি হয়',
  'yogas.mangalDosha': 'মঙ্গল দোষ',
  'yogas.otherAfflictions': 'অন্য দোষ',
  'yogas.kalasarpa': 'কালসর্প',
  'yogas.ashtakavarga': 'অষ্টকবর্গ',
  'yogas.strongest': 'সর্বাধিক বল',
  'yogas.weakest': 'সর্বনিম্ন বল',
  'yogas.total': 'মোট',
  'yogas.manglik': 'মাঙ্গলিক',
  'yogas.notManglik': 'মাঙ্গলিক নয়',
  'yogas.manglikCancelled': 'মাঙ্গলিক, তবে দোষ ভঙ্গ',
  'yogas.noKalsarpa': 'কালসর্প নেই',
  'yogas.yoga': 'যোগ',
  'yogas.yogaPlural': 'যোগ',
  'yogas.affliction': 'দোষ',
  'yogas.afflictionPlural': 'দোষ',

  'readings.title': 'ফলাদেশ',
  'readings.today': 'আজ',
  'readings.thisWeek': 'এই সপ্তাহ',
  'readings.thisMonth': 'এই মাস',
  'readings.thisYear': 'এই বছর',
  'readings.whatEngineFound': 'গণনায় যা পাওয়া গেল',
  'readings.whereThisStands': 'বর্তমান অবস্থা',
  'readings.awaitingReview':
    'এই ফলাদেশ লেখা হয়ে গেছে এবং প্রকাশের আগে পড়ে দেখার অপেক্ষায় আছে। বড় ' +
    'ফলাদেশ সবসময় হাতে যাচাই করা হয়। যে ভিত্তিতে এটি তৈরি, তা নীচে দেওয়া ' +
    'আছে এবং তা বদলায় না।',
  'readings.disclaimer':
    'ফলাদেশ প্রবণতা বলে, নিশ্চয়তা নয়, এবং এটি চিকিৎসা, আইনি বা আর্থিক ' +
    'পরামর্শের বিকল্প নয়। যেখানে স্বাস্থ্যের প্রশ্ন, সেখানে চিকিৎসককেই ' +
    'জিজ্ঞাসা করা উচিত।',

  'remedies.eyebrow': 'উপায়',
  'remedies.conduct': 'আচরণ',
  'remedies.charity': 'দান',
  'remedies.fasting': 'উপবাস',
  'remedies.mantra': 'মন্ত্র',
  'remedies.gemstone': 'রত্ন',

  'gate.needsAccount': 'এর জন্য অ্যাকাউন্ট প্রয়োজন। তৈরি করা বিনামূল্যে এবং এক মুহূর্তের কাজ।',
  'gate.needsPremium': 'এটি সদস্যপদের অংশ।',
  'gate.disabled': 'এটি আপাতত বন্ধ। আবার ফিরে আসবে।',
  'gate.unavailable': 'এটি উপলভ্য নয়।',
  'gate.createAccount': 'অ্যাকাউন্ট তৈরি করুন',
  'gate.backToTools': 'বিনামূল্যের সরঞ্জামে ফিরুন',

  'settings.title': 'সেটিংস',
  'settings.language': 'ভাষা',
  'settings.theme': 'রূপ',
  'settings.save': 'সেটিংস সংরক্ষণ করুন',
  'settings.saved': 'সেটিংস সংরক্ষিত হয়েছে।',

  'tool.kundli.label': 'জন্ম কুণ্ডলী',
  'tool.panchang.label': 'পঞ্চাঙ্গ',
  'tool.dasha.label': 'দশা কাল',
  'tool.transits.label': 'গোচর',
  'tool.matching.label': 'গুণ মিলন',
  'tool.yogas.label': 'যোগ ও দোষ',
  'tool.remedies.label': 'উপায়',
  'tool.nakshatra.label': 'নক্ষত্র অনুসন্ধান',

  'tool.kundli.description': 'ভাব, নক্ষত্র, গ্রহবল এবং ষোলটি বর্গ কুণ্ডলী সহ সম্পূর্ণ বৈদিক কুণ্ডলী।',
  'tool.panchang.description': 'আজকের তিথি, নক্ষত্র, যোগ ও করণ, প্রকৃত সূর্যোদয়, রাহুকাল এবং শুভ সময়ের সঙ্গে।',
  'tool.dasha.description': 'আপনার দশা চারটি স্তর পর্যন্ত, প্রতিটির শুরু ও শেষের সঠিক তারিখ সহ।',
  'tool.transits.description': 'আপনার কুণ্ডলীর সাপেক্ষে গ্রহের বর্তমান অবস্থান, সাড়ে সাতি ও তার পর্যায় সহ।',
  'tool.matching.description': 'আটটি কূটে অষ্টকূট মিলন, মঙ্গল দোষ ও তার ভঙ্গ সহ।',
  'tool.yogas.description': 'আপনার কুণ্ডলীতে গঠিত প্রতিটি যোগ, তার কারণ সহ, এবং মাঙ্গলিক, কালসর্প ও অষ্টকবর্গ।',
  'tool.remedies.description': 'যে গ্রহগুলির বল প্রয়োজন তাদের প্রথাগত উপায়, রত্ন সম্পর্কে স্পষ্ট মন্তব্য সহ।',
  'tool.nakshatra.description': 'আপনার জন্ম নক্ষত্র, পাদ, অধিপতি গ্রহ এবং শাস্ত্রে তার বর্ণনা।',

  // Added with the strings that now read through the dictionary.
  'step.kundli': 'আপনার কুণ্ডলী',
  'step.nakshatra': 'আপনার নক্ষত্র',
  'step.dasha': 'কী চলছে',
  'step.yogas': 'কী তৈরি হয়',
  'step.transits': 'কী আসছে',
  'step.remedies': 'কী সহায়ক',
  'step.matching': 'অন্য কারও সঙ্গে',
  'rail.aria': 'এই কুণ্ডলী নিয়ে কোথায় যাবেন',
  'rail.path': 'কুণ্ডলী পড়ার ক্রম',
  'rail.checks': 'নির্দিষ্ট পরীক্ষা',
  'rail.fullReport': 'সম্পূর্ণ কুণ্ডলী রিপোর্ট',
  'rail.of': 'এর মধ্যে',
  'pager.aria': 'কুণ্ডলীতে সামনে-পিছনে যান',
  'pager.back': 'পিছনে',
  'pager.next': 'পরে',
  'form.genderLegend': 'লিঙ্গ',
  'form.genderFemale': 'নারী',
  'form.genderMale': 'পুরুষ',
  'form.genderUndisclosed': 'বলতে চাই না',
  'form.genderNote': 'কেবল সেখানেই ব্যবহৃত হয় যেখানে শাস্ত্রীয় নিয়মের প্রয়োজন: দুটি কুণ্ডলী মেলানোর সময় আটটি কূটের কয়েকটি কন্যা থেকে বরের ক্রমে গণনা করা হয়। কুণ্ডলীর আর কিছুই এর উপর নির্ভর করে না।',
  'form.errDate': 'অনুগ্রহ করে জন্ম তারিখ দিন।',
  'form.errPlace': 'অনুগ্রহ করে তালিকা থেকে জন্মস্থান বেছে নিন।',
  'form.errTime': 'অনুগ্রহ করে জন্ম সময় দিন, বা “আমি জন্ম সময় জানি না” বেছে নিন।',
  'form.errGender': 'অনুগ্রহ করে লিঙ্গের তিনটি বিকল্পের একটি বেছে নিন।',
  'form.calculating': 'গণনা চলছে…',
  'form.searching': 'খুঁজছি…',

  // Chart legend and workspace.
  'legend.retrograde':
    'বক্রী, পিছনে চলছে',
  'legend.rashisNotHouses':
    'রাশি, ভাব নয়',
  'legend.hide':
    'লুকান',
  'legend.how':
    'এই কুণ্ডলী কীভাবে পড়বেন?',
  'legend.north1':
    'ভাব কখনও বদলায় না। উপরের কেন্দ্রীয় খণ্ডটি সর্বদা প্রথম ভাব, এবং গণনা সেখান থেকে বামাবর্তে চলে। এটি দক্ষিণ ভারতীয় শৈলীর বিপরীত, যেখানে রাশি স্থির থাকে এবং ভাব বদলায়।',
  'legend.north2':
    'প্রতিটি ভাবে লেখা সংখ্যাটি সেখানে থাকা রাশি। 1 মেষ এবং 12 মীন। তাই উপরের খণ্ডে 7 থাকলে আপনার লগ্ন তুলা।',
  'legend.south':
    'রাশি কখনও বদলায় না। মেষ সর্বদা উপরের সারির দ্বিতীয় ঘর এবং ক্রম দক্ষিণাবর্তে চলে। ভাব সংখ্যা আপনার লগ্ন অনুসারে বদলায়।',
  'legend.grahas':
    'দুই অক্ষরের চিহ্নগুলি গ্রহ। Su সূর্য, Mo চন্দ্র, Ma মঙ্গল, Me বুধ, Ju গুরু, Ve শুক্র, Sa শনি, Ra রাহু এবং Ke কেতু। পাশের ছোট সংখ্যাটি সেই রাশিতে তার অংশ।',
  'legend.strength':
    'কোনও গ্রহ আপনার পক্ষে শুভ না অশুভ, তা আপনার লগ্নের উপর নির্ভর করে, তার সাধারণ পরিচিতির উপর নয়। তাই এটি কুণ্ডলীতে রঙে নয়, নীচের তালিকায় কথায় বলা হয়েছে। শুভ ভাবের অধিপতি পাপগ্রহ আপনার সেরা গ্রহ হতে পারে।',
  'legend.crowded':
    'ভিড় থাকা ভাবে অংশ লুকানো হয় এবং চিহ্নগুলি দুই কলামে সরে যায়, যাতে কিছুই নিজের ভাবের বাইরে না যায়।',
  'chart.readingTheChart':
    'কুণ্ডলী পড়া',
  'chart.selectHouse':
    'যেকোনো ভাব বেছে নিয়ে দেখুন তার রাশি, অধিপতি, সেখানে থাকা গ্রহ এবং তার উপর দৃষ্টি দেওয়া গ্রহ।',
};

export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, bn };

/** Every key English defines, for the completeness test. */
export const KEYS = Object.keys(en);
