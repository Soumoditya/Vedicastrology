import {
  NAKSHATRA_DEITY,
  NAKSHATRA_GANA,
  NAKSHATRA_LORD,
  NAKSHATRA_NAMES,
  NAKSHATRA_SYMBOL,
  NAKSHATRA_YONI,
  type AnyGraha,
} from '@/lib/astro/constants';

/**
 * The twenty-seven birth stars, read.
 *
 * The nakshatra is the oldest layer of the system — older than the twelve signs
 * in Indian use — and it is what a traditional astrologer reaches for first when
 * asked what somebody is like. The report could name it and its pada and then
 * stop. This is the rest.
 *
 * Fixed table, same rule as everything else under `predictions/`: written once,
 * checkable against a source, never generated at the moment somebody asks. Each
 * entry is derived from the four things the classical texts attach to a star —
 * its ruling graha, its deity, its gaṇa (temperament class) and its yoni (animal
 * nature) — plus its symbol, all of which are already tabulated in
 * `astro/constants.ts` and are what a jyotiṣi would actually reason from.
 *
 * The three fields are the ones a reader wants and are kept apart deliberately:
 * what you are like, how that shows up in work and money, and what it costs.
 * The third field is the one that makes the other two worth trusting — a
 * description with no cost in it is flattery, and flattery is what makes these
 * pages worthless everywhere else.
 *
 * Nothing here predicts an event, a diagnosis, a lifespan or a birth.
 * `checkSafety` runs over every entry in the tests.
 */

export interface NakshatraReading {
  /** 0-26, Ashwini first. */
  index: number;
  name: string;
  lord: AnyGraha;
  deity: string;
  gana: string;
  yoni: string;
  symbol: string;
  /** Disposition and how the person comes across. */
  nature: string;
  /** How the star tends to express itself in work and income. */
  work: string;
  /** The standing cost of the same disposition. */
  caution: string;
}

const TEXT: [string, string, string][] = [
  [
    'Speed is the whole signature. Ashwini gives a quick, restless, physically confident nature — first to arrive, first to volunteer, first to be bored. There is a healer’s streak in it: you are the person who acts while others are still deciding, and in a genuine emergency that is worth more than deliberation.',
    'Anything that rewards a fast start and a short cycle. Medicine and the caring trades, emergency work, transport, sport, and any independent venture where the decision is yours to make in the moment. Income tends to arrive in bursts rather than a smooth line.',
    'What is begun quickly is abandoned quickly. The recurring cost of this star is a trail of things nine-tenths finished, and the discipline that changes the most is simply staying past the point where it stops being interesting.',
  ],
  [
    'Bharani carries weight. This star gives endurance and a capacity to hold difficulty without passing it on — people bring you what they cannot handle themselves. There is strong feeling under a controlled surface, and a moral seriousness that shows as an unwillingness to look away from what is unpleasant.',
    'Work with responsibility and consequence in it: care, law, administration, anything with a duty of custody. You do well where the stakes are real and poorly where the work is decorative. Money comes through persistence rather than opportunity.',
    'Bearing everything is a habit, not a virtue, past a certain point. This star tends to carry other people’s burdens until resentment builds quietly and arrives all at once. Say what is too much while it is still merely too much.',
  ],
  [
    'Krittika is sharp, and the sharpness is the gift. This star gives clarity, a low tolerance for pretence and the willingness to say the thing everyone is avoiding. There is a purifying quality to it — you cut away what is not working, in a project or in a life, faster than most people can face.',
    'Anywhere judgement and standards matter: editing, teaching, quality of any kind, cooking, engineering, criticism. You are valuable precisely because you will not sign off on something that is not right. Recognition comes late and then solidly.',
    'The same edge that clarifies also wounds, and it lands harder than you intend because it is accurate. The work is timing and proportion — not softening what is true, but choosing when it is useful to say it.',
  ],
  [
    'Rohini is the star of growth and of being wanted. It gives charm, an eye for beauty, material good sense and a steadiness that people settle around. There is real magnetism here; things and people accumulate near you without your having to chase them.',
    'Anything involving taste, land, growth or the making of tangible things: agriculture, food, design, textiles, property, the arts. You build slowly and keep what you build. Money tends to come steadily and to stay.',
    'Comfort is the trap in a star this comfortable. The cost is a reluctance to disturb an arrangement that is pleasant but finished, and an attachment to possessions that quietly starts making the decisions. Notice when contentment has become avoidance.',
  ],
  [
    'Mrigashira is a searching star — curious, gentle, easily fascinated and never quite settled. It gives a light, questing manner and a nose for what is interesting; you find things, and you find people, by following a scent nobody else noticed.',
    'Research, journalism, travel, writing, buying and sourcing, anything that rewards the person who goes and looks. You do best with a wide brief and badly with a narrow one. Income follows curiosity rather than planning, which works better than it sounds.',
    'The search can become the point. This star tends to leave for the next interesting thing at exactly the moment the current one would have paid off, and to be restless in relationships for the same reason. Finishing is the whole of the discipline.',
  ],
  [
    'Ardra is the storm and what grows after it. This star gives intensity, penetrating intelligence and a nature that is transformed by difficulty rather than merely surviving it. There is often turbulence early and a marked competence that comes out of it.',
    'Work that involves analysis, systems, or repairing what has broken — technology, research, psychology, crisis work, anything where the interesting problems are the ones that went wrong. Ability here is frequently recognised after a rough start.',
    'The intensity turns inward when there is nothing to work on. This star is prone to holding on to old injury and re-examining it, which is not the same as understanding it. Put the analytical power on something outside yourself.',
  ],
  [
    'Punarvasu is the star of return. It gives an unusually resilient, generous and philosophical nature — you lose things and recover, you begin again without bitterness, and people find you easy to be near because of it. Simplicity is genuinely attractive to you.',
    'Teaching, counsel, writing, anything nurturing or explanatory. You do well in work that can be picked up again after interruption, and unusually well as a second career. Money is adequate rather than abundant, and this star minds that less than most.',
    'Beginning again is a strength that can become a way of never consolidating. The cost is scattering — several starts, none carried far enough to compound. Choose which one gets your next five years.',
  ],
  [
    'Pushya is the most auspicious star in the classical reckoning, and its quality is nourishment. It gives steadiness, loyalty, an instinct to protect and a conservatism that is about care rather than fear. People rely on you and are right to.',
    'Teaching, medicine, food, public service, priesthood, and any long institutional career. This star does well where continuity is valued and poorly where disruption is. Income is steady and slow to change in either direction.',
    'Caution hardens into rigidity if it is never tested. The cost is holding a position, or a person, past the point where holding helps — and a difficulty in accepting care rather than giving it.',
  ],
  [
    'Ashlesha is penetrating and self-contained. This star gives insight into what people are actually doing as opposed to what they say, considerable persuasive power, and a nature that keeps its own counsel. It is the most private of the stars and the least easily deceived.',
    'Anything requiring insight into motive: negotiation, investigation, psychology, medicine, strategy. You read situations accurately and can act on the reading. Money is handled shrewdly and rarely discussed.',
    'The same perception, turned suspicious, sees plots where there is only carelessness. The cost of this star is isolation — and a temptation to use influence sideways when saying the thing directly would have worked.',
  ],
  [
    'Magha carries lineage. This star gives dignity, a sense of inheritance and an instinct for tradition — you are conscious of what came before you and of a standard to be lived up to. There is natural authority in the bearing, and generosity toward those under your protection.',
    'Positions with standing: leadership, institutions, ceremony, family enterprise, heritage work. You do well where respect is part of the compensation and badly where it is absent regardless of the money.',
    'Standing can become the point rather than the by-product. The cost is pride that will not be corrected, and a difficulty with people who do not grant the deference you did not ask for out loud but did expect.',
  ],
  [
    'Purva Phalguni is warmth and enjoyment. This star gives an affectionate, sociable and creative nature, a real talent for making occasions and a belief — a correct one — that pleasure is not frivolous. People like being around you and say so.',
    'The arts, hospitality, entertainment, design, anything social or celebratory. Charm is a working asset here and not a distraction from one. Money arrives easily and departs at the same rate.',
    'Ease is the risk in a star this comfortable. The cost is postponing effort until the enjoyable part is over, and a tendency to spend on the strength of a good mood rather than a balance.',
  ],
  [
    'Uttara Phalguni is the reliable friend. This star gives generosity organised into actual usefulness — help that arrives as arrangements rather than sympathy. There is a strong sense of fairness, a liking for stable partnership, and patience with detail that others find dull.',
    'Administration, contracts, partnership, charity and public works. You do particularly well in a role with a defined remit and a long tenure. Income is steady and often improves through association with others.',
    'Being depended upon becomes an identity. The cost of this star is difficulty saying no, and a resentment that builds unspoken because the help was volunteered rather than requested.',
  ],
  [
    'Hasta is skill in the hands and in the handling. This star gives dexterity, wit, resourcefulness and an ability to make things work with whatever is present. There is a lightness to the manner that conceals considerable capability.',
    'Craft, surgery, art, trade, writing, anything where the hands or the fine detail carry the work. You are good at the practical solution nobody had thought of. Income responds directly to effort here, more than in most charts.',
    'Cleverness can be spent on getting around a problem rather than solving it. The cost is a habit of the quick fix, and restlessness when the work stops requiring ingenuity.',
  ],
  [
    'Chitra is the maker. This star gives an eye for form, a strong aesthetic sense and a wish to leave behind something well made and visible. There is glamour in it — you are noticed, and you take some care to be.',
    'Architecture, design, fashion, engineering, photography, anything where the result is looked at and judged. You do best with real creative control and worst executing someone else’s mediocre idea. Earnings track reputation closely.',
    'Appearance can start standing in for substance. The cost of this star is vanity about the work and about the self, and a sensitivity to criticism that is disproportionate because the work is personal.',
  ],
  [
    'Swati is independence. This star gives self-sufficiency, adaptability and a genuine dislike of being controlled — you would rather have less on your own terms than more on someone else’s. There is diplomacy here too, and a light touch in dealing with people.',
    'Trade, negotiation, independent business, travel, anything self-directed. This star does markedly better working for itself than for an employer. Income is variable and the variability is tolerable to you.',
    'Independence taken far enough becomes isolation and a refusal of help that would have cost nothing. The cost is also indecisiveness — the same flexibility that adapts well also blows about.',
  ],
  [
    'Vishakha is ambition with a purpose behind it. This star gives determination, focus on a goal and the patience to pursue it past discouragement. There is a dual quality — two aims, two phases of life — and considerable force once the aim is settled.',
    'Anything goal-directed and competitive: business, politics, research, athletics, campaigning. You do best with a target and a deadline and poorly with open-ended work. Success here characteristically arrives later than expected and then substantially.',
    'The goal can consume everything around it, including the people. The cost is impatience with anyone in the way, and a hollowness on arrival if the aim was never examined.',
  ],
  [
    'Anuradha is friendship and organised devotion. This star gives loyalty, an ability to work with people across differences, and success achieved away from where you started. It is the most companionable of the stars and the best at sustained co-operation.',
    'Anything collaborative or organisational: management, associations, international work, long projects with many hands. You are the person who holds a group together. Income improves through networks rather than through solo effort.',
    'Devotion given to the wrong object is still devotion, and this star is slow to admit a misplacement. The cost is loyalty outlasting its warrant, and difficulty with the loneliness of being far from home.',
  ],
  [
    'Jyeshtha is seniority and its weight. This star gives capability, protectiveness and a certain guardedness — you have generally had responsibility earlier than was fair, and it shows as competence and as a reluctance to be vulnerable.',
    'Positions of authority and responsibility: management, the forces, medicine, anything where somebody has to be accountable. You handle crises well. Money is usually earned rather than fortunate.',
    'Carrying it alone becomes a point of pride. The cost of this star is isolation at the top, a temper that surfaces when authority is questioned, and a difficulty in asking for the help you would readily give.',
  ],
  [
    'Mula goes to the root. This star gives an investigative, unsentimental nature and a willingness to pull a thing apart to see what it rests on. Endings do not frighten you the way they frighten others, which makes you useful when something has to be finished.',
    'Research, philosophy, medicine, and any work involving fundamentals or dismantling — the deep question rather than the surface one. This star often has an unsettled early period and finds its footing distinctly later.',
    'Not everything benefits from being pulled apart. The cost is a habit of dismantling arrangements — including good ones — out of restlessness, and of speaking the unvarnished truth where it was not asked for.',
  ],
  [
    'Purva Ashadha is invincible conviction. This star gives confidence, persuasive power and a refusal to be discouraged that carries others along. There is an expansive, buoyant quality to it; you talk people into things, generally things worth doing.',
    'Advocacy, teaching, sales, politics, water and shipping in the classical reckoning, anything requiring persuasion and stamina. You recover from setbacks faster than the people around you. Income tends to rise in steps.',
    'Confidence that never doubts stops taking in information. The cost is over-commitment on the strength of belief, and difficulty conceding a point once it has been argued in public.',
  ],
  [
    'Uttara Ashadha is the later victory. This star gives integrity, staying power and a preference for winning properly or not at all. There is a seriousness of purpose and a patience with slow results that most people cannot sustain.',
    'Leadership, public office, institutions, long research, anything where a reputation is built over decades. This star characteristically does its most important work in the second half of life.',
    'Rigidity is the cost — a standard applied to others as strictly as to yourself, and a slowness to change course after new information. Also a tendency to defer living until the work is done.',
  ],
  [
    'Shravana is listening. This star gives receptivity, a memory for what was said, and learning acquired through attention rather than assertion. There is a scholarly quality and a strong feeling for tradition and for the spoken word.',
    'Teaching, law, languages, media, counsel, anything where hearing accurately is the skill. You gather knowledge steadily and are trusted as a source. Income is stable and often connected to reputation for reliability.',
    'Listening to everyone makes it hard to hear yourself. The cost of this star is being swayed by the last persuasive voice, and a sensitivity to gossip and to what is said about you.',
  ],
  [
    'Dhanishta is rhythm and capability. This star gives energy, musicality, sociability and material competence — things prosper around you. There is a natural sense of timing, in music and in affairs, and considerable practical drive.',
    'Music and performance, property, business, the forces, anything requiring rhythm and organisation together. This star is among the most reliably prosperous, and wealth here tends to be built rather than inherited.',
    'Pace can become the only setting. The cost is impatience with slower people, a hardness that arrives under pressure, and difficulty being still when stillness is what is required.',
  ],
  [
    'Shatabhisha is the hundred healers, and its quality is solitary insight. This star gives an independent, analytical, somewhat secretive nature with a strong pull toward what is hidden — medicine, mysticism, systems, anything with a puzzle in it.',
    'Medicine and healing, research, technology, astrology, anything specialised and slightly apart. You do well working alone or in a small expert group, and poorly in open-plan collaboration. Recognition comes from competence rather than visibility.',
    'Privacy hardens into unreachability. The cost of this star is loneliness treated as a preference, a stubbornness about being helped, and a tendency to withhold what would be easier said.',
  ],
  [
    'Purva Bhadrapada has intensity and a double nature. This star gives idealism, unconventional intelligence and a capacity for sustained effort toward something most people would consider unrealistic. There is seriousness here and an interest in what lies past the ordinary.',
    'Research, esoteric or specialised study, writing, work with the neglected or the difficult. This star does badly in conventional careers and unexpectedly well in eccentric ones. Income is irregular and follows conviction.',
    'Idealism without a check becomes extremity. The cost is anxiety, a tendency to swing between commitment and withdrawal, and impatience with the compromises that ordinary life requires.',
  ],
  [
    'Uttara Bhadrapada is depth and calm. This star gives patience, wisdom, an unhurried compassion and a settled quality that other people find steadying. It is the most inwardly quiet of the stars, and the least in need of an audience.',
    'Counsel, teaching, philosophy, charity, long-term stewardship. You do well in work with a contemplative or advisory element. Money is sufficient and rarely a driver, which tends to make it easier rather than harder to come by.',
    'Depth without motion becomes withdrawal. The cost is passivity — waiting for a situation to resolve itself when it needed a decision — and a reluctance to assert a claim you are entitled to make.',
  ],
  [
    'Revati nourishes and sees people off safely. The last of the stars gives kindness, imagination, an instinct for guiding others and a gentleness that is not weakness. There is an artistic sensibility and a genuine sympathy that people feel immediately.',
    'Caring work, teaching the young, the arts, travel, anything involving guidance or safe passage. You do well where sensitivity is an asset and badly in harsh environments. Income is modest to comfortable and often supported by others’ goodwill.',
    'Sympathy without a limit is drained rather than spent. The cost of this star is over-giving, difficulty with endings, and a habit of taking responsibility for feelings that were never yours to manage.',
  ],
];

const READINGS: NakshatraReading[] = TEXT.map(([nature, work, caution], i) => ({
  index: i,
  name: NAKSHATRA_NAMES[i],
  lord: NAKSHATRA_LORD[i],
  deity: NAKSHATRA_DEITY[i],
  gana: NAKSHATRA_GANA[i],
  yoni: NAKSHATRA_YONI[i],
  symbol: NAKSHATRA_SYMBOL[i],
  nature,
  work,
  caution,
}));

export function nakshatraReading(index: number): NakshatraReading {
  return READINGS[((index % 27) + 27) % 27];
}

/**
 * What a pada adds, in one line.
 *
 * Each star is quartered, and the quarters are not interchangeable — the pada
 * places the star in a navamsa sign and shifts its emphasis. This says which
 * quarter and what it weights, without pretending to a fourfold reading of every
 * star, which would be a hundred and eight entries written to fill a page.
 */
const PADA_EMPHASIS = [
  'the first quarter, which weights the star toward action and self — its qualities show most plainly in what you do first',
  'the second quarter, which weights it toward resources and the material — its qualities show in what you build and keep',
  'the third quarter, which weights it toward communication and relationship — its qualities show in how you deal with people',
  'the fourth quarter, which weights it toward inwardness and completion — its qualities show most in private',
];

export function padaEmphasis(pada: number): string {
  return PADA_EMPHASIS[Math.min(3, Math.max(0, pada - 1))];
}

export { READINGS as NAKSHATRA_READINGS };
