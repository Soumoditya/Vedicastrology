import type { Metadata } from 'next';

import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What this site collects, what it never collects, and how to have any of ' +
    'it deleted.',
};

/**
 * Privacy policy.
 *
 * Written against what the code actually does, not from a template. Every
 * claim here is checkable in the repository, which is public: the research
 * tables are in supabase/migrations, and what is written to them is in
 * src/lib/research/capture.ts.
 */
export default function PrivacyPage() {
  const updated = '29 July 2026';

  return (
    <div className="relative">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <p className="eyebrow">Privacy</p>
        <h1
          className="font-display mt-5 text-[clamp(2rem,5vw,3rem)] leading-[1.05]"
          style={{ color: 'var(--text-primary)' }}
        >
          What is collected, and what is not
        </h1>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Last updated {updated}
        </p>

        <div className="prose-vedic mt-10">
          <p>
            This site is built so that most of it works without knowing anything
            about you. Every free tool, including the birth chart, panchang,
            dasha, transits, matching and nakshatra finder, works without an
            account and without storing anything.
          </p>

          <h2>Using the free tools</h2>
          <p>
            Birth details you type into a tool are sent to the server, used to
            calculate the chart, and returned to you. They are not written to
            any database and not kept afterwards. They do appear in the page
            address, which is deliberate so you can bookmark or share a chart,
            and it also means a chart link contains birth details. Treat such a
            link the way you would treat the details themselves.
          </p>
          <p>
            When you search for a birth place, the text you type is sent to
            Open-Meteo&apos;s geocoding service to turn it into coordinates. It
            receives the place name only, never your birth date or time.
          </p>

          <h2>If you create an account</h2>
          <p>
            An account stores your email address, a display name if you give
            one, and any charts you choose to save. Saved charts hold the birth
            details only. The chart itself is recalculated each time you view
            it, so nothing stale is kept.
          </p>
          <p>
            Accounts and authentication run on Supabase. You can delete any
            saved chart at any time from your dashboard, and asking for the
            whole account to be removed will have it deleted along with
            everything attached to it.
          </p>

          <h2>Enquiries</h2>
          <p>
            When you send an enquiry, what you write is stored so it can be
            answered, and a notification is emailed. Nothing you send is used
            for marketing and nothing is passed to anyone else.
          </p>

          <h2>The research set</h2>
          <p>
            Classical Jyotisha rests on rules written down centuries ago, most
            of which have never been checked against a large body of real
            charts. Account holders can choose to contribute a chart to a
            research set used for that.
          </p>
          <p>
            <strong>This is off unless you turn it on.</strong> It is never
            assumed, never bundled into signing up, and can be withdrawn at any
            time. Withdrawing deletes the contribution immediately, and that
            deletion is enforced by the database itself rather than by code that
            could forget.
          </p>
          <p>What a contribution contains:</p>
          <ul>
            <li>Birth date, time and coordinates</li>
            <li>The country of birth, and nothing narrower</li>
            <li>The calculated chart: positions, houses, dignities, divisional placements</li>
            <li>
              Anything you chose to add yourself, such as relationship status,
              education or field of work
            </li>
          </ul>
          <p>What it never contains:</p>
          <ul>
            <li>Your name or email</li>
            <li>Your account identifier</li>
            <li>The town or city, only the country</li>
            <li>Anything that links the chart back to you</li>
          </ul>
          <p>
            The link between you and your contribution exists in one place only,
            as a random identifier on your profile. The research table itself
            cannot be connected to any person by someone who obtains it alone.
          </p>

          <h2>Health information</h2>
          <p>
            If you choose to record years of significant ill health, that is
            asked for separately, with its own agreement. Health information is
            treated as a special category in law, and folding it into a general
            agreement would not be a real choice.
          </p>
          <p>
            Only the year is ever recorded. No description of what happened, no
            diagnosis, nothing else. Withdrawing that agreement erases those
            years while leaving the rest of your contribution intact.
          </p>

          <h2>What is not done</h2>
          <ul>
            <li>Nothing is sold or shared with advertisers</li>
            <li>There are no advertising or tracking scripts</li>
            <li>There is no profiling and no automated decision making about you</li>
            <li>Cookies are limited to signing in and remembering your currency and theme</li>
          </ul>

          <h2>Your rights</h2>
          <p>
            You can ask for a copy of what is held about you, ask for it to be
            corrected, or ask for it to be deleted. Where consent is the basis
            for something, you can withdraw it at any time, and for research
            that is a single switch on your dashboard rather than a request.
          </p>
          <p>
            Depending on where you live, these rights come from the UK and EU
            GDPR, or from India&apos;s Digital Personal Data Protection Act
            2023. The site is built to the stricter reading of the two, which
            avoids treating anyone as having fewer rights because of where they
            happen to be.
          </p>

          <h2>Verifying any of this</h2>
          <p>
            The site&apos;s source code is public. The research tables are in{' '}
            <code>supabase/migrations</code> and exactly what gets written to
            them is in <code>src/lib/research/capture.ts</code>. You do not have
            to take this page&apos;s word for it.
          </p>

          <h2>Getting in touch</h2>
          <p>
            For anything about your data, use the{' '}
            <a href="/contact">contact page</a> or write via{' '}
            <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
