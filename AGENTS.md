<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Every string ships translated

This site is read in English, Hindi and Bengali, and the language switch is
expected to change *all* of the content, not some of it. The mechanism has never
been the problem: the locale is resolved on the server, a missing key falls back
to English rather than rendering blank, and the dictionary has been complete in
all three languages. The problem has always been strings that were never routed
through the dictionary at all — the switch cannot translate what it has never
been shown.

So, when adding or changing user-facing text:

1. Put the string in `src/lib/i18n/dictionary.ts` and read it through `t()` —
   `getT()` or `getNames()` on the server. Do not inline user-facing English in a
   component.
2. Add the Hindi and Bengali in the same change. Not later: a key that falls back
   to English still renders, so the gap is invisible and survives.
3. `tests/i18n/parity.test.ts` fails the build when one locale is missing
   another's keys, carries a key English does not, or leaves a value blank.

**The one exception is legal text.** `legal/privacy`, `legal/terms` and
`legal/refund` stay in English, with a line stating that the English version
governs. A mistranslated retention or refund clause is a liability rather than a
rough edge, and that is a decision for a lawyer or a professional translator, not
for whoever is editing the page.

Astrological vocabulary — graha, rashi and nakshatra names, dignities — lives in
`src/lib/i18n/astro-names.ts`, keyed by locale, and is reached through
`getNames()`. Interpretive prose belongs in a locale-keyed content module, not
embedded in a calculation file, so that it can be translated at all.
