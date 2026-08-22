import { RASHI_LORD, RASHI_NAMES_EN, type AnyGraha } from '@/lib/astro/constants';

/**
 * The twelve ascendants, read.
 *
 * The report could say which sign was rising and then say nothing about it.
 * This is the missing half: what the tradition actually attributes to each
 * lagna, written out as a fixed table like everything else under
 * `predictions/`, for the same reason — a reading somebody may act on is not
 * something to generate on the spot, and a table can be checked against a
 * source while generated prose cannot.
 *
 * Each entry is derived from three things the classical texts agree on: the
 * sign's lord, its element and modality, and its place on the Kālapuruṣa — the
 * zodiac mapped onto a body, head at Aries and feet at Pisces, which is where
 * the constitutional attributions come from.
 *
 * **On the health field.** It says where the tradition puts a sign's attention,
 * never what is wrong with anybody. Jyotiṣa has nothing to say about a
 * diagnosis and this site will not pretend otherwise, so these are written as
 * the part of the body a sign governs and the habits that suit it — the sort of
 * thing a person might mention to a doctor, never a substitute for asking one.
 * `checkSafety` is run over every entry in the tests.
 *
 * The Moon sign reads from the same table. A sign's significations do not change
 * with the point you count from; what changes is the register — the ascendant
 * describes how somebody meets the world, the Moon how they experience it —
 * and that shift is made in the sentence that introduces the reading rather than
 * by writing a second set of twelve.
 */

export interface LagnaReading {
  /** 0-11, Aries first. */
  rashi: number;
  name: string;
  lord: AnyGraha;
  element: 'fire' | 'earth' | 'air' | 'water';
  modality: 'movable' | 'fixed' | 'dual';
  /** The part of the body this sign governs on the Kālapuruṣa. */
  governs: string;
  /** How the person is read by others; bearing and first impression. */
  bearing: string;
  /** Working temperament — how they go at a task, and what they find hard. */
  temperament: string;
  /** Where the tradition puts constitutional attention. Never a diagnosis. */
  constitution: string;
}

const READINGS: LagnaReading[] = [
  {
    rashi: 0,
    name: 'Aries',
    lord: 'Mars',
    element: 'fire',
    modality: 'movable',
    governs: 'the head',
    bearing:
      'You arrive before you are introduced. An Aries ascendant reads as direct, physically present and quick to commit — people decide what you are within a minute of meeting you, and they are usually not far wrong. The manner is frank rather than polished, which wins trust from some and puts others on their guard.',
    temperament:
      'Mars gives initiative rather than patience. You start well, you are at your best when something needs doing immediately and nobody else has moved, and you lose interest at roughly the point where a thing becomes maintenance. The work is to finish, or to hand over deliberately rather than by drifting away. Competition sharpens you; being managed does not.',
    constitution:
      'Aries governs the head, so the tradition points here first — sleep, eye strain, and the headaches that follow a long stretch of pushing. Heat is the classical theme: sharp appetite, quick temper, quick recovery. Regular physical effort settles this ascendant more reliably than rest does. Anything persistent belongs with a doctor rather than with a chart.',
  },
  {
    rashi: 1,
    name: 'Taurus',
    lord: 'Venus',
    element: 'earth',
    modality: 'fixed',
    governs: 'the face and throat',
    bearing:
      'Steady, unhurried, and better looking after things than acquiring them. A Taurus ascendant reads as calm and difficult to rush, which people find restful and occasionally maddening. You are trusted with what matters because you do not drop things, and you are rarely the first person consulted about something new.',
    temperament:
      'Venus wants the work to be pleasant and the surroundings in order, and you do markedly better in both. You are persistent past the point where most people stop, which is your real advantage, and stubborn past the point where persistence helps, which is its cost. Changing your mind is expensive for you; give yourself the time it genuinely takes rather than defending a position you have privately left.',
    constitution:
      'Taurus governs the face and throat, and the classical attributions cluster there — voice, the throat in a dry season, the teeth. Appetite is the other theme: this ascendant enjoys food and tends to keep what it eats, so meals at regular hours do more than any restriction. Persistent hoarseness is a matter for a doctor.',
  },
  {
    rashi: 2,
    name: 'Gemini',
    lord: 'Mercury',
    element: 'air',
    modality: 'dual',
    governs: 'the arms, shoulders and breath',
    bearing:
      'Quick, verbal, and hard to bore. A Gemini ascendant reads as clever and approachable, the person who can talk to anybody in the room and usually has. Youth stays in the manner long after it has left the birth certificate. The risk is being taken as lighter than you are, because fluency reads as ease.',
    temperament:
      'Mercury gives range rather than depth, and the whole of your working life is the argument between those. You learn faster than almost anyone around you and you tire of a subject at about the moment mastery would start. Write things down — not as advice but as method; your thinking clarifies on paper in a way it does not in your head. Choose one thing to be genuinely good at and let the rest stay interests.',
    constitution:
      'Gemini governs the arms, shoulders and the breath. The tradition points at the nervous system: this ascendant runs on stimulation and pays for it in sleep. Hands and shoulders take the strain of desk work. The single most useful habit is a fixed hour for going to bed, which this ascendant resists and benefits from more than most.',
  },
  {
    rashi: 3,
    name: 'Cancer',
    lord: 'Moon',
    element: 'water',
    modality: 'movable',
    governs: 'the chest and stomach',
    bearing:
      'Guarded at first and warm once you are through. A Cancer ascendant reads as kind and slightly private — people feel looked after by you before they feel they know you. You remember what others said and did, at length, which makes you a good friend and a slow forgiver.',
    temperament:
      'The Moon gives feeling as an instrument rather than a weakness: you read a room accurately and you act on that reading. It also means your work is only as steady as your mood, and your mood answers to sleep, food and company more than to circumstance. Protect those three and the capability takes care of itself. You do your best work for people rather than for targets, so find the person your work serves.',
    constitution:
      'Cancer governs the chest and stomach, and the classical theme is digestion answering to feeling — this ascendant carries worry in the stomach and knows it. Water and regular meals matter more here than they do for most. Sleep is the lever: a fortnight of a fixed bedtime changes more than any dietary rule.',
  },
  {
    rashi: 4,
    name: 'Leo',
    lord: 'Sun',
    element: 'fire',
    modality: 'fixed',
    governs: 'the heart and upper back',
    bearing:
      'You are noticed, and you are more comfortable being noticed than you admit. A Leo ascendant carries authority in the bearing — people look to you for the decision even when you hold no rank, and they take a refusal from you harder than from anyone else. Generosity is the natural register, and it is real.',
    temperament:
      'The Sun wants the visible role and does badly in the supporting one. You work best with your name on the outcome and worst when credit is pooled. Loyalty runs both ways with you and is not negotiable, which makes you a good person to work for and a difficult one to work around. Pride is the standing cost: being right and winning are not the same thing, and this ascendant learns that slowly.',
    constitution:
      'Leo governs the heart and the upper back. The tradition reads this as a constitution of strong reserves and poor pacing — capable of a great deal and reluctant to stop before it is finished. Steady exercise rather than occasional exertion is what suits it. Anything to do with the heart is a doctor’s question and not a chart’s, and this ascendant in particular should not wait to ask.',
  },
  {
    rashi: 5,
    name: 'Virgo',
    lord: 'Mercury',
    element: 'earth',
    modality: 'dual',
    governs: 'the abdomen and digestion',
    bearing:
      'Precise, useful, and quietly critical. A Virgo ascendant reads as competent — the person who noticed the error, who has the document, who will actually do the thing they said. The manner is modest, which means your contribution is often visible only in the fact that nothing went wrong.',
    temperament:
      'Mercury in an earth sign gives method: you improve what exists rather than inventing what does not, and you are better at that than the people who invent things are willing to admit. The cost is a standard nobody meets, starting with you. Perfectionism here is not vanity, it is discomfort — and the useful discipline is finishing to a good-enough mark on purpose, once, to prove the world does not end. Service suits you; being praised embarrasses you.',
    constitution:
      'Virgo governs the abdomen, and digestion is the classical theme — this is the ascendant most often described as sensitive in that respect. Worry and appetite are linked here and the link runs both ways. Plain food at regular hours, and rest taken before it is deserved, are the traditional advice and are not bad advice.',
  },
  {
    rashi: 6,
    name: 'Libra',
    lord: 'Venus',
    element: 'air',
    modality: 'movable',
    governs: 'the lower abdomen and kidneys',
    bearing:
      'Easy company, and better at people than you give yourself credit for. A Libra ascendant reads as fair and pleasant — you are the one asked to mediate, because both sides expect you to hear them. Charm is genuine here rather than strategic, which is why it works.',
    temperament:
      'Venus in an air sign gives judgement and a horror of being the one who decides. You see every side, which is a real analytical gift and a real trap: the decision still has to be made, and made late it costs more. Partnership is where you do your best work — you sharpen against another person and go slack alone. Watch the habit of agreeing in the room and disagreeing afterwards; it is how this ascendant most often loses trust.',
    constitution:
      'Libra governs the lower abdomen and the kidneys, and the classical theme is balance — fluids, and the effect of an irregular routine on them. Water matters here in a plain literal way. The other traditional note is that this ascendant carries other people’s tension as its own; a habit of putting things down at the end of the day is worth more than it sounds.',
  },
  {
    rashi: 7,
    name: 'Scorpio',
    lord: 'Mars',
    element: 'water',
    modality: 'fixed',
    governs: 'the pelvis and the generative system',
    bearing:
      'Reserved, watchful, and much harder to read than you are to notice. A Scorpio ascendant gives presence without display — people sense depth and are not sure what is in it, which draws some and unsettles others. You give little away early and a great deal once committed.',
    temperament:
      'Mars in a water sign gives endurance rather than dash: you last, you research, you find what was hidden, and you do not forget. This is the ascendant that finishes what it privately decided to finish years ago. The cost is that everything is felt at full strength, including slights, and grudges here are expensive to carry and hard to put down. Deliberate honesty about what you actually want is the discipline that unlocks this chart.',
    constitution:
      'Scorpio governs the pelvis and the generative system. The classical reading is of strong recuperative power alongside a tendency to ignore symptoms until they insist — this ascendant does not complain early. That is precisely why routine check-ups are worth keeping. Intensity is the constitutional theme; deliberate rest is the counterweight.',
  },
  {
    rashi: 8,
    name: 'Sagittarius',
    lord: 'Jupiter',
    element: 'fire',
    modality: 'dual',
    governs: 'the hips and thighs',
    bearing:
      'Open, direct and cheerful, with an honesty that arrives before tact does. A Sagittarius ascendant reads as principled and good company — people trust your word quickly, partly because you offer your real opinion when a polite one was expected.',
    temperament:
      'Jupiter gives breadth, belief and a teacher’s instinct. You work best when the work means something beyond itself, and you go flat on a task you cannot justify. Optimism is the engine and the standing risk: you promise on the strength of what should be possible rather than what has been. The correction is small and dull — count the hours before agreeing to the deadline. Travel and study genuinely change your fortunes rather than merely improving your mood.',
    constitution:
      'Sagittarius governs the hips and thighs, and the tradition also links this ascendant to the liver — the classical note is a good appetite for everything, food included, and a constitution that tolerates excess until it abruptly does not. Movement suits it: this is a body that does better used than rested.',
  },
  {
    rashi: 9,
    name: 'Capricorn',
    lord: 'Saturn',
    element: 'earth',
    modality: 'movable',
    governs: 'the knees and joints',
    bearing:
      'Serious, contained, and older than your years until quite suddenly you are younger than them. A Capricorn ascendant reads as reliable and somewhat formal — people give you responsibility early because you look like someone who will carry it, and you generally do.',
    temperament:
      'Saturn gives patience, structure and a long horizon. You will do dull work properly for years to reach something, which is a genuine advantage over almost everyone, and you underestimate how rare it is. The cost is a heaviness that reads as pessimism and is closer to caution — and a habit of measuring yourself against a standard you never agreed to. Ambition here is real but slow-burning: this chart does better after thirty-five than before it, and that is a description rather than a consolation.',
    constitution:
      'Capricorn governs the knees and the joints generally, and the classical attribution is dryness and cold — stiffness that answers to warmth and movement. This ascendant tends to work through tiredness rather than around it. Rest taken deliberately, and warmth, are the traditional measures, and both are more useful than they sound.',
  },
  {
    rashi: 10,
    name: 'Aquarius',
    lord: 'Saturn',
    element: 'air',
    modality: 'fixed',
    governs: 'the calves and ankles',
    bearing:
      'Friendly at a slight distance. An Aquarius ascendant reads as independent and even-handed — you get on with everyone and are close to few, and that is a preference rather than a difficulty. People find you unusual before they find you warm, and then find you unusually loyal.',
    temperament:
      'Saturn in an air sign gives system-building: you think in structures, you are drawn to what is unorthodox on the merits rather than for effect, and you hold a position long after the room has moved. Groups and causes suit you better than hierarchies. The cost is a stubbornness that looks like principle from the inside and obstinacy from outside; the useful check is asking whether you still hold the view or only the position.',
    constitution:
      'Aquarius governs the calves and ankles, and the classical theme is circulation — this ascendant is often described as cold in the extremities and irregular in its habits. Regular hours help disproportionately here, which is unfortunate for a sign that dislikes them. Anything to do with circulation is a doctor’s question.',
  },
  {
    rashi: 11,
    name: 'Pisces',
    lord: 'Jupiter',
    element: 'water',
    modality: 'dual',
    governs: 'the feet',
    bearing:
      'Gentle, perceptive and slightly elsewhere. A Pisces ascendant reads as kind and unguarded — people tell you things they had not planned to, because you do not appear to be judging, and you are not. Boundaries are the lifelong subject, not the manner.',
    temperament:
      'Jupiter in a water sign gives imagination and sympathy, and both are working faculties rather than decoration: you understand situations you have not been told about. The cost is porousness — other people’s moods arrive as your own, and it takes practice to tell which is which. You do well in work with a creative or caring element and badly in work with no meaning in it. Deadlines set by someone else help this chart more than it wants to admit.',
    constitution:
      'Pisces governs the feet, and the classical theme is sensitivity — to food, to medication, to environment, in the sense of noticing effects that others do not. This ascendant is traditionally advised to take rest early rather than late. Anything unclear about a reaction is a matter for a doctor or a pharmacist, not for a chart.',
  },
];

export function lagnaReading(rashi: number): LagnaReading {
  return READINGS[((rashi % 12) + 12) % 12];
}

/**
 * The same sign, introduced as the Moon rather than the ascendant.
 *
 * The Moon is read as the mind and the felt life where the lagna is read as the
 * body and the bearing, so the framing sentence differs and the material does
 * not. Writing a second set of twelve to say the same significations in a
 * different order would be padding, and padding is how a report gets long
 * without getting better.
 */
export function rashiFraming(rashi: number): string {
  const r = lagnaReading(rashi);
  return (
    `Your Moon is in ${RASHI_NAMES_EN[r.rashi]}, ruled by ${RASHI_LORD[r.rashi]}. ` +
    `Where the ascendant describes how you meet the world, the Moon describes how ` +
    `you experience it — so read what follows as your inner weather rather than ` +
    `your outward manner.`
  );
}

export { READINGS as LAGNA_READINGS };
