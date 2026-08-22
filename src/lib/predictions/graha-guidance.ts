/**
 * What each house is about, and what each graha asks for.
 *
 * These three tables were written for `advice.ts` and now serve `remedies.ts`
 * as well, which is why they live in their own module rather than in either.
 * A direct import between those two would be a cycle — `advice.ts` already
 * reads `REMEDY_TABLE` out of `remedies.ts` — and a second copy of the prose
 * would be the kind of duplicate that drifts silently until the two pages
 * disagree about the same chart.
 *
 * Fixed tables, deliberately, like everything else under `predictions/`. Advice
 * a person may act on, spend money on or organise their week around is not
 * something to generate on the spot.
 */

/** House significations, phrased as the part of life rather than the label. */
export const HOUSE_AREA: Record<number, string> = {
  1: 'health and how you carry yourself',
  2: 'money kept, family and speech',
  3: 'courage, effort and siblings',
  4: 'home, peace of mind and the mother',
  5: 'children, learning and judgement',
  6: 'work, obligation and health under strain',
  7: 'partnership and marriage',
  8: 'what is hidden, inherited or shared',
  9: 'belief, fortune and the father',
  10: 'work in the world and standing',
  11: 'income, gain and the people around you',
  12: 'expense, retreat and what is left behind',
};

/** What to do more of when a graha is running well. */
export const GRAHA_LEAN: Record<string, string> = {
  Sun: 'Take the visible role rather than the supporting one. Speak to people senior to you directly.',
  Moon: 'Keep a regular sleep and eating rhythm. Work near water or greenery if you can choose.',
  Mars: 'Physical effort and clear deadlines suit this period. Start the thing that needs starting.',
  Mercury: 'Write things down, sign the paperwork, learn the skill. Communication is the lever now.',
  Jupiter: 'Teach, study, or take the advice of somebody older. Generosity returns during this period.',
  Venus: 'Attend to relationships and to the look of things. Comfort spent on now is not wasted.',
  Saturn: 'Do the slow, unglamorous work properly. What is built carefully now outlasts you.',
  Rahu: 'Unfamiliar ground favours you. Take the foreign, the technical, the unconventional route.',
  Ketu: 'Withdraw a little. Depth over breadth, and finishing over starting.',
};

/** What to be careful of when a graha is under strain. */
export const GRAHA_CAUTION: Record<string, string> = {
  Sun: 'Avoid contests of pride with people who hold authority over you. Being right is not the same as winning.',
  Moon: 'Guard your rest and your company. Low mood in this period is a passing weather, not a verdict on your life.',
  Mars: 'Slow down on the road and in argument. Anger costs more than it gains here.',
  Mercury: 'Read the contract twice. Misunderstandings in this period come from haste, not from bad faith.',
  Jupiter: 'Do not over-promise. Optimism runs ahead of what can be delivered.',
  Venus: 'Do not spend to feel better, and do not settle a relationship question in a hurry.',
  Saturn: 'Expect delay and plan for it rather than fighting it. Cutting corners is the expensive choice now.',
  Rahu: 'Be wary of a shortcut that seems too good. Verify who you are dealing with.',
  Ketu: 'Do not let detachment turn into neglect of things that need attending to.',
};

/**
 * One concrete habit per graha, small enough to actually keep.
 *
 * The gap the remedies page had: it could say a graha needed support and name
 * the classical measure, but a mantra count of nineteen thousand is not what
 * somebody does on a Tuesday. These are, and they are deliberately dull — a
 * practice kept for a year at five minutes a day does more than one grand
 * observance, which is the tradition's own position on the matter.
 */
export const GRAHA_TIPS: Record<string, string[]> = {
  Sun: [
    'See daylight within an hour of waking, outside rather than through a window.',
    'Deal with the person in charge directly instead of routing around them.',
    'Finish one thing a day that has your name on it.',
  ],
  Moon: [
    'Keep the same bedtime for a fortnight and see what changes.',
    'Say the thing you are carrying to one person, out loud.',
    'Keep water within reach; eat at roughly the same hours.',
  ],
  Mars: [
    'Put the energy somewhere physical, daily, before it finds its own outlet.',
    'Give an argument one night before answering it.',
    'Do one thing each week that takes a little nerve.',
  ],
  Mercury: [
    'Write something every day, however short.',
    'Keep your word on trivial matters — that is where Mercury is actually tested.',
    'Read one thing harder than you would choose.',
  ],
  Jupiter: [
    'Keep a teacher in your life and accept their correction.',
    'Give time rather than only money.',
    'Say the true thing when a comfortable one is available.',
  ],
  Venus: [
    'Keep your surroundings in order; Venus notices.',
    'Be generous with the person closest to you in a way that costs you something.',
    'Take one pleasure properly rather than several carelessly.',
  ],
  Saturn: [
    'Do the boring task before the interesting one.',
    'Keep one commitment for longer than you feel like keeping it.',
    'Treat whoever works for you better than the situation requires.',
  ],
  Rahu: [
    'Name what you are chasing, then ask plainly whether you want it.',
    'Keep one area of life deliberately simple.',
    'Stay off whatever you reach for compulsively, one day at a time.',
  ],
  Ketu: [
    'Keep a practice with no outcome attached to it.',
    'Give away something you were keeping for no reason.',
    'Sit with a question for a week instead of settling it.',
  ],
};
