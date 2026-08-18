import type { Metadata } from 'next';
import Image from 'next/image';
import { DateTime } from 'luxon';

import { buildFullReport } from '@/lib/report/build';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { chartToDataUri } from '@/lib/chart-render/svgString';
import { sarvaVerdict } from '@/lib/astro/ashtakavarga';
import { RASHI_SYMBOLS } from '@/lib/astro/constants';
import { formatDms } from '@/lib/astro/zodiac';
import { SHLOKAS } from '@/lib/shlokas';
import { SITE } from '@/lib/site';
import { getNames } from '@/lib/i18n/server';
import { gateFor } from '@/components/site/FeatureGate';
import { JourneyRail } from '@/components/chart/JourneyRail';
import { PrintButton } from '@/components/chart/PrintButton';
import { ToolIntro } from '@/components/chart/ToolIntro';
import { Ganesha, Om } from '@/components/ornament/Ornaments';

export const metadata: Metadata = {
  title: 'Full written report',
  description:
    'Everything about a chart in one document: birth details, panchang, ' +
    'Avakhada Chakra, D1, D9 and D10, yogas, doshas, dasha, transits, ' +
    'twelve areas of life, and remedies. Laid out for print.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('full_report', '/report');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/report');


  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Sampūrṇa Phala"
        headline="The whole chart,"
        highlight="in one document."
        action="/report"
        submitLabel="Build my report"
      >
        <p>
          Around twenty pages. Birth details and the times a traditional kundli
          opens with, the panchang of your birth, the Avakhada Chakra, your
          rashi, lagna and nakshatra with their lords, the D1, D9 and D10 charts,
          every yoga and dosha the chart forms, Manglik, Kalsarpa, the full
          Vimshottari dasha, current transits, Sade Sati, twelve areas of life
          read one by one, every planet with its remedy, and practical and
          religious advice at the end.
        </p>
        <p>
          Made to be printed or saved as a PDF. Use your browser&rsquo;s print
          dialogue and choose Save as PDF. Switch the site language first if you
          want it in Hindi or Bengali.
        </p>
      </ToolIntro>
    );
  }

  let parsed;
  try {
    parsed = parseBirthQuery(params);
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p style={{ color: 'var(--color-malefic)' }}>
          Those birth details were not valid. Please enter them again.
        </p>
      </div>
    );
  }

  const r = buildFullReport(parsed.birth, {
    displayName: parsed.displayName,
    settings: parsed.settings,
  });

  // Names in the reader's own script. The prose around them is still English
  // for now; the vocabulary is what fills a page, so it goes first.
  const { n } = await getNames();

  const zone = r.chart.meta.timezone;
  const bt = r.birthTime;
  const p = r.panchang;
  const who = r.displayName ?? 'This chart';

  return (
    <div className="report-page">
      {/* Screen only. On paper the whole thing prints. */}
      <div className="no-print mx-auto max-w-4xl px-5 pt-16">
        <JourneyRail current="full_report" params={params} />
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Print this page, or save it as a PDF from the print dialogue.
          </p>
          <PrintButton />
        </div>
      </div>

      {/* ==================================================== 1. COVER === */}
      <section className="report-cover-page">
        <Image
          src="/report/cover.jpg"
          alt=""
          fill
          priority
          className="report-cover-art"
          sizes="(max-width: 800px) 100vw, 800px"
        />
        <div className="report-cover-inner">
          <p className="report-cover-brand">{SITE.name.toUpperCase()}</p>
          <h1 className="report-cover-title font-display">Complete Vedic Reading</h1>
          <p className="report-cover-sub">Sampūrṇa Jyotiṣa Phala</p>

          <div className="report-cover-card">
            <Row label="Name" value={r.displayName ?? 'Not given'} />
            <Row label="Date of birth" value={formatBirthDate(r)} />
            <Row label="Time of birth" value={formatBirthTime(r)} />
            <Row label="Place of birth" value={r.chart.meta.place.name} />
            <Row label="Report prepared" value={DateTime.now().toFormat('d LLLL yyyy')} />
          </div>

          <p className="report-cover-foot">
            {SITE.url.replace(/^https?:\/\//, '')} · @{SITE.instagram}
          </p>
        </div>
      </section>

      {/* ==================================== 2. BASIC AND TIME DETAILS === */}
      <Page>
        <PageHead title="Birth details" sanskrit="Janma Vivaraṇa" />

        <Block title="Basic details">
          <Grid>
            <Cell label="Gender" value={genderOf(params)} />
            <Cell label="Date of birth" value={formatBirthDate(r)} />
            <Cell label="Day of birth" value={n.vara(p.vara.index)} />
            <Cell label="Time of birth" value={formatBirthTime(r)} />
            <Cell label="Place of birth" value={r.chart.meta.place.name} />
            <Cell label="Latitude" value={`${r.chart.meta.place.latitude.toFixed(4)}°`} />
            <Cell label="Longitude" value={`${r.chart.meta.place.longitude.toFixed(4)}°`} />
            <Cell label="Time zone" value={`${zone} (${bt.zoneOffsetFormatted})`} />
          </Grid>
        </Block>

        <Block title="Birth time and local time details">
          <Grid>
            <Cell label="Ishtkaal" value={bt.ishtakaal?.formatted ?? 'Time not known'} />
            <Cell label="Ishtkaal (clock)" value={bt.ishtakaal?.clock ?? '—'} />
            <Cell label="Local time correction" value={bt.localTimeCorrectionFormatted} />
            <Cell label="War time correction" value={bt.warTimeCorrectionFormatted} />
            <Cell label="LMT at birth" value={bt.lmt} />
            <Cell label="GMT at birth" value={bt.gmt} />
            <Cell label="Sunrise" value={time(bt.sunrise, zone)} />
            <Cell label="Sunset" value={time(bt.sunset, zone)} />
            <Cell label="Day duration" value={bt.dayDurationFormatted ?? '—'} />
            <Cell label="Night duration" value={bt.nightDurationFormatted ?? '—'} />
          </Grid>
          <Note>
            Ishtkaal is the time elapsed from sunrise to birth, in ghati and
            pala. One ghati is twenty four minutes. It is the figure a chart was
            cast from before clocks were standardised, and it is printed here so
            this reading can be checked against one worked by hand.
          </Note>
        </Block>

        <Block title="Panchang at birth">
          <Grid>
            <Cell label="Hindu week day" value={`${p.vara.name} (${n.vara(p.vara.index)})`} />
            <Cell label="Paksha" value={n.paksha(p.tithi.paksha)} />
            <Cell label="Tithi" value={p.tithi.name} />
            <Cell label="Yoga" value={p.yoga.name} />
            <Cell label="Karan" value={p.karana.name} />
            <Cell label="Nakshatra" value={`${p.nakshatra.name} (${n.graha(p.nakshatra.lord)})`} />
          </Grid>
        </Block>

        <Block title="Avakhada Chakra">
          <Grid>
            <Cell label="Varna" value={r.avakhada.varna} />
            <Cell label="Vashya" value={r.avakhada.vashya} />
            <Cell label="Yoni" value={r.avakhada.yoni} />
            <Cell label="Gana" value={r.avakhada.gana} />
            <Cell label="Nadi" value={r.avakhada.nadi} />
            <Cell label="Paya" value={r.avakhada.paya} />
          </Grid>
          <Note>
            Varna here is a temperament grouping derived from the Moon sign. It
            has nothing to do with caste or birth in the social sense, and it is
            worth saying so plainly rather than leaving the word to be read the
            other way.
          </Note>
        </Block>

        <Block title="Natal identity">
          <Grid>
            <Cell label="Lagna" value={n.rashi(r.identity.lagnaRashi)} />
            <Cell label="Lagna lord" value={n.graha(r.identity.lagnaLord)} />
            <Cell label="Rasi" value={n.rashi(r.chart.byGraha.Moon.rashi)} />
            <Cell label="Rasi lord" value={n.graha(r.identity.rasiLord)} />
            <Cell label="Nakshatra" value={n.nakshatra(r.chart.byGraha.Moon.nakshatra)} />
            <Cell label="Pada" value={String(r.identity.pada)} />
            <Cell label="Nakshatra lord" value={n.graha(r.identity.nakshatraLord)} />
            <Cell
              label="Dasa balance at birth"
              value={`${n.graha(r.dasha.balance.lord)}: ${r.dasha.balance.years} Years, ${r.dasha.balance.months} Months, ${r.dasha.balance.days} Days`}
            />
          </Grid>
        </Block>
      </Page>

      {/* =============================== 3. FAVOURABLE AND GHATAKA ======= */}
      <Page>
        <PageHead title="Favourable points" sanskrit="Śubha Vicāra" />

        <Block title="What favours you">
          <Grid>
            <Cell label="Lucky number" value={String(r.favourable.number)} />
            <Cell label="From the lagna lord" value={String(r.favourable.ascendantNumber)} />
            <Cell label="Favourable colour" value={r.favourable.colour} />
            <Cell label="Favourable day" value={r.favourable.day} />
            <Cell label="Favourable direction" value={r.favourable.direction} />
            <Cell label="Element" value={r.favourable.element} />
            <Cell label="Stone of the rasi lord" value={r.favourable.stone} />
            <Cell label="Deity of the rasi lord" value={r.favourable.deity} />
          </Grid>
          <Note>
            Every value above is derived from {n.graha(r.identity.rasiLord)}, the lord of
            your Moon sign, which is the traditional derivation. It is not
            invented per person, and the derivation is given so it can be
            checked.
          </Note>
        </Block>

        <Block title="Ghatak Chakra">
          <Grid>
            <Cell label="Ghatak month" value={r.ghataka.month} />
            <Cell label="Ghatak tithi" value={r.ghataka.tithi} />
            <Cell label="Ghatak day" value={n.vara(r.ghataka.varaIndex)} />
            <Cell label="Ghatak nakshatra" value={n.nakshatra(r.ghataka.nakshatraIndex)} />
            <Cell label="Ghatak lagna" value={n.rashi(r.ghataka.lagnaIndex)} />
            <Cell label="Ghatak rasi" value={n.rashi(r.ghataka.rashiIndex)} />
          </Grid>
          <Note>{r.ghataka.note}</Note>
        </Block>

        <Block title="Your nakshatra">
          <p className="report-prose">
            {who} is born under {n.nakshatra(r.chart.byGraha.Moon.nakshatra)}, pada{' '}
            {r.identity.pada}, ruled by {n.graha(r.identity.nakshatraLord)}. The nakshatra
            lord is what sets the Vimshottari dasha sequence running, so this one
            graha decides the order in which your whole life unfolds, which is a
            larger claim than it first sounds.
          </p>
          <p className="report-prose">
            Yoni {r.avakhada.yoni}, gana {r.avakhada.gana}, nadi{' '}
            {r.avakhada.nadi}. These three are the values a matchmaker reads
            first, and they are the reason the Ashtakoota score comes out as it
            does.
          </p>
        </Block>

        <Block title="Your lagna and rasi">
          <p className="report-prose">
            The ascendant is {n.rashi(r.identity.lagnaRashi)}, ruled by{' '}
            {n.graha(r.identity.lagnaLord)}. The ascendant is the body and the temperament,
            and its lord is the graha whose condition matters most in the whole
            chart: whatever else a chart contains, a strong lagna lord carries it
            and a weak one struggles under it.
          </p>
          <p className="report-prose">
            The Moon is in {n.rashi(r.chart.byGraha.Moon.rashi)}, ruled by {n.graha(r.identity.rasiLord)}.
            Where the ascendant is the body, the Moon is the mind. In Indian
            practice the Moon sign is the one used for daily prediction and for
            matching, which is why a person is often given a different sign here
            than the one they know from a newspaper.
          </p>
        </Block>
      </Page>

      {/* ===================================== 4 to 6. THE CHARTS ======== */}
      {r.charts.map((c) => (
        <Page key={c.code}>
          <PageHead title={c.title} sanskrit={c.code} />
          <div className="report-chart-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chartToDataUri(c.data, { size: 520, background: '#ffffff' })} alt={c.title} />
          </div>
          <Note>{c.note}</Note>

          {c.code === 'D1' && (
            <Block title="Every graha, house by house">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Graha</th>
                    <th>Rashi</th>
                    <th>Position</th>
                    <th>House</th>
                    <th>Dignity</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {r.chart.planets.map((planet) => (
                    <tr key={planet.graha}>
                      <td>{n.graha(planet.graha)}</td>
                      <td>{n.rashi(planet.rashi)}</td>
                      <td className="tabular-nums">{formatDms(planet.degreeInRashi)}</td>
                      <td className="tabular-nums">{planet.house}</td>
                      <td>{n.dignity(planet.dignity)}</td>
                      <td>
                        {[planet.retrograde && 'retrograde', planet.combust && 'combust']
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Block>
          )}
        </Page>
      ))}

      {/* =========================== 7. YOGAS, DOSHAS, MANGLIK, KALSARPA = */}
      <Page>
        <PageHead title="What the chart forms" sanskrit="Yoga and Doṣa" />

        <Block title={`Yogas (${r.yogas.yogas.length})`}>
          {r.yogas.yogas.length === 0 ? (
            <p className="report-prose">
              No named yoga forms under its full conditions. That is an ordinary
              result and not a poor one. Most listings you will find elsewhere
              check half the conditions, which is why they report five.
            </p>
          ) : (
            r.yogas.yogas.map((y, i) => (
              <Finding key={`${y.name}-${i}`} name={y.name} reason={y.reason} meta={y.strength} />
            ))
          )}
        </Block>

        <Block title={`Doshas (${r.yogas.doshas.length})`}>
          {r.yogas.doshas.length === 0 ? (
            <p className="report-prose">No affliction is detected in this chart.</p>
          ) : (
            r.yogas.doshas.map((d, i) => (
              <Finding key={`${d.name}-${i}`} name={d.name} reason={d.reason} meta={d.strength} />
            ))
          )}
        </Block>

        <Block title="Mangal dosha">
          <p className="report-verdict">
            {!r.manglik.present
              ? 'Not Manglik'
              : r.manglik.cancelled
                ? 'Manglik, but cancelled'
                : 'Manglik'}
          </p>
          <p className="report-prose">
            Checked from the ascendant, the Moon and Venus. From the ascendant:{' '}
            {r.manglik.fromAscendant ? 'afflicted' : 'clear'}. From the Moon:{' '}
            {r.manglik.fromMoon ? 'afflicted' : 'clear'}. From Venus:{' '}
            {r.manglik.fromVenus ? 'afflicted' : 'clear'}.
          </p>
          {r.manglik.cancellationReasons.length > 0 && (
            <ul className="report-list">
              {r.manglik.cancellationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Kalsarpa">
          <p className="report-verdict">
            {r.yogas.kalsarpa.present
              ? `${r.yogas.kalsarpa.partial ? 'Partial ' : ''}${r.yogas.kalsarpa.typeName} Kalsarpa`
              : 'No Kalsarpa'}
          </p>
          {r.yogas.kalsarpa.present && (
            <p className="report-prose">
              Rahu occupies the {ordinal(r.yogas.kalsarpa.rahuHouse)} house and Ketu
              the {ordinal(r.yogas.kalsarpa.ketuHouse)}, which names this form{' '}
              {r.yogas.kalsarpa.typeName}. It is said to concern{' '}
              {r.yogas.kalsarpa.saidToSignify}.
            </p>
          )}
          <Note>{r.yogas.kalsarpa.note}</Note>
        </Block>
      </Page>

      <Divider
        art="/report/mandala.jpg"
        part="Part two"
        title="Your life, area by area"
        sanskrit="Bhāva Phala"
      />

      {/* ============================================ 8. LIFE AREAS ====== */}
      {chunk(r.lifeAreas, 3).map((group, i) => (
        <Page key={`areas-${i}`}>
          {/* No PageHead: the part divider immediately before this carries it. */}
          {group.map((area) => (
            <Block key={area.key} title={area.title}>
              <p className="report-meta">
                Houses {area.houses.join(', ')} · karaka {area.karaka}
              </p>
              {area.findings.map((finding, j) => (
                <p key={j} className="report-prose">
                  {finding}
                </p>
              ))}
            </Block>
          ))}
        </Page>
      ))}

      {/* ================================================ 9. DASHA ======= */}
      <Page>
        <PageHead title="The periods of your life" sanskrit="Viṁśottarī Daśā" />

        <Block title="Balance at birth">
          <p className="report-prose">
            {n.graha(r.dasha.balance.lord)}: {r.dasha.balance.years} Years,{' '}
            {r.dasha.balance.months} Months, {r.dasha.balance.days} Days
            remaining at the moment of birth. The sequence then runs in the fixed
            Vimshottari order for a hundred and twenty years.
          </p>
        </Block>

        <Block title="Every mahadasha">
          <table className="report-table">
            <thead>
              <tr>
                <th>Lord</th>
                <th>From</th>
                <th>To</th>
                <th>Years</th>
              </tr>
            </thead>
            <tbody>
              {r.dasha.mahadashas.map((d) => {
                const running = d.start <= r.generatedAt && r.generatedAt < d.end;
                return (
                  <tr key={`${d.lord}-${d.start.toISOString()}`} className={running ? 'is-now' : ''}>
                    <td>
                      {n.graha(d.lord)}
                      {running ? ' (running)' : ''}
                    </td>
                    <td className="tabular-nums">{DateTime.fromJSDate(d.start).toFormat('d LLL yyyy')}</td>
                    <td className="tabular-nums">{DateTime.fromJSDate(d.end).toFormat('d LLL yyyy')}</td>
                    <td className="tabular-nums">
                      {((d.end.getTime() - d.start.getTime()) / (365.25 * 86_400_000)).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Block>

        <Block title="Running now">
          <p className="report-prose">{r.dasha.current ?? 'Outside the computed range.'}</p>
        </Block>

        <Block title="The next ten years">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {r.dasha.upcoming.slice(0, 18).map((change, i) => (
                <tr key={i}>
                  <td className="tabular-nums">
                    {DateTime.fromJSDate(change.date).toFormat('d LLL yyyy')}
                  </td>
                  <td>{describeChange(change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      </Page>

      {/* ============================= 10. TRANSITS AND SADE SATI ======== */}
      <Page>
        <PageHead title="Where the sky is now" sanskrit="Gochara" />

        <Block title="Current transits">
          <table className="report-table">
            <thead>
              <tr>
                <th>Graha</th>
                <th>Rashi</th>
                <th>From lagna</th>
                <th>From Moon</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {r.transits.map((t) => (
                <tr key={t.graha}>
                  <td>{n.graha(t.graha)}</td>
                  <td>{n.rashi(t.rashi)}</td>
                  <td className="tabular-nums">{t.houseFromAscendant}</td>
                  <td className="tabular-nums">{t.houseFromMoon}</td>
                  <td>{t.retrograde ? 'retrograde' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>

        <Block title="Sade Sati">
          <p className="report-verdict">
            {r.sadeSati.active
              ? `Running, ${r.sadeSati.currentPhase!.phase} phase`
              : 'Not running'}
          </p>
          {r.sadeSati.active && r.sadeSati.currentPhase && (
            <p className="report-prose">
              This phase runs from{' '}
              {DateTime.fromJSDate(r.sadeSati.currentPhase.start).toFormat('d LLLL yyyy')} to{' '}
              {DateTime.fromJSDate(r.sadeSati.currentPhase.end).toFormat('d LLLL yyyy')}, with
              {n.graha('Saturn')} in {n.rashi(r.sadeSati.currentPhase.rashi)}.
            </p>
          )}
          <p className="report-prose">
            Kantaka and Ashtama Shani:{' '}
            {r.sadeSati.dhaiya.active
              ? `${r.sadeSati.dhaiya.type === 'kantaka' ? 'Kantaka' : 'Ashtama'} Shani is running.`
              : 'Neither is running at present.'}
          </p>
          <Note>
            Roughly one person in four is in Sade Sati at any moment, which is
            far too many for it to explain a single person&rsquo;s difficulty on
            its own. It describes a period of weight and consolidation, and it is
            read alongside the running dasha rather than instead of it.
          </Note>
        </Block>

        <Block title="Ashtakavarga, sign by sign">
          <table className="report-table">
            <thead>
              <tr>
                {RASHI_SYMBOLS.map((symbol, rashi) => (
                  <th key={rashi} title={n.rashi(rashi)}>
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {r.ashtakavarga.sarva.map((bindus, rashi) => (
                  <td key={rashi} className="tabular-nums">
                    {bindus}
                    {sarvaVerdict(bindus) === 'strong' ? ' ▲' : sarvaVerdict(bindus) === 'weak' ? ' ▽' : ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <Note>
            A transit over a sign holding thirty two points reads very
            differently from the same transit over a sign holding twenty two. The
            seven totals always sum to 337, which is how these tables check
            themselves.
          </Note>
        </Block>
      </Page>

      {/* ====================================== 11. PLANET BY PLANET ===== */}
      <Page>
        <PageHead title="Each graha, and what helps it" sanskrit="Graha Vicāra" />

        {r.chart.planets.map((planet) => {
          const need = r.remedies.grahas.find((g) => g.graha === planet.graha);
          const own = r.remedies.remedies.filter((rem) => rem.graha === planet.graha);

          return (
            <Block key={planet.graha} title={n.graha(planet.graha)}>
              <p className="report-meta">
                {n.rashi(planet.rashi)} {formatDms(planet.degreeInRashi)} ·{' '}
                house {planet.house} · {n.dignity(planet.dignity)}
                {planet.retrograde ? ' · retrograde' : ''}
                {planet.combust ? ' · combust' : ''}
              </p>

              {need ? (
                <>
                  <p className="report-prose">{need.reasons.join(' ')}</p>
                  {own.length > 0 && (
                    <ul className="report-list">
                      {own.map((rem, i) => (
                        <li key={i}>{rem.action}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="report-prose">
                  {n.graha(planet.graha)} is in reasonable condition in this chart and
                  needs no particular support. A remedy for a graha that is
                  already working is effort spent where it changes nothing.
                </p>
              )}
            </Block>
          );
        })}
      </Page>

      <Divider
        art="/report/frame.jpg"
        part="Part three"
        title="What to do about it"
        sanskrit="Upāya"
      />

      {/* ==================================== 12. REMEDIES AND ADVICE ==== */}
      <Page>
        <Block title="Remedies for the chart as a whole">
          {r.remedies.grahas.length === 0 ? (
            <p className="report-prose">
              Nothing in this chart calls for a remedy. That is a good result and
              it is reported honestly rather than padded out.
            </p>
          ) : (
            <>
              <p className="report-prose">
                {r.remedies.grahas.length === 1
                  ? 'One graha in this chart asks for support:'
                  : `${r.remedies.grahas.length} grahas in this chart ask for support, in this order of priority:`}
              </p>
              <ol className="report-list report-ordered">
                {r.remedies.grahas.map(({ graha, reasons }) => {
                  // The conduct remedy only. The full set for each graha is on
                  // the planet by planet pages, and repeating all of it here
                  // added twenty duplicate lines to the document.
                  const conduct = r.remedies.remedies.find(
                    (rem) => rem.graha === graha && rem.kind === 'conduct',
                  );
                  return (
                    <li key={graha}>
                      <strong>{n.graha(graha)}</strong>
                      {' · '}
                      {reasons[0]}
                      {conduct && <span className="report-conduct">{conduct.action}</span>}
                    </li>
                  );
                })}
              </ol>
              <p className="report-meta">
                Charity, fasting, mantra and stone for each are set out on the
                planet by planet pages above.
              </p>
            </>
          )}
          <Note>{r.remedies.gemstoneNote}</Note>
        </Block>

        <Block title="Practical advice">
          {r.advice.practical.map((item, i) => (
            <div key={i} className="report-advice">
              <p className="report-advice-area">{item.area}</p>
              <p className="report-prose">{item.body}</p>
              <p className="report-meta">{item.because}</p>
            </div>
          ))}
        </Block>

        <Block title="Religious practice">
          <p className="report-prose">
            Your ishta devata is <strong>{r.advice.religious.ishtaDevata}</strong>.
          </p>
          <p className="report-meta">{r.advice.religious.derivation}</p>
          <Grid>
            <Cell label="Atmakaraka" value={n.graha(r.advice.religious.atmakaraka)} />
            <Cell label="Ishta graha" value={n.graha(r.advice.religious.ishtaGraha)} />
            <Cell label="Fasting day" value={r.advice.religious.fastingDay} />
            <Cell label="Direction" value={r.advice.religious.direction} />
            <Cell label="Charity" value={r.advice.religious.charity} />
            <Cell
              label="Mantra"
              value={`${r.advice.religious.mantra} · ${r.advice.religious.mantraCount} times`}
            />
          </Grid>
          <ul className="report-list">
            {r.advice.religious.practices.map((practice, i) => (
              <li key={i}>{practice}</li>
            ))}
          </ul>
        </Block>

        <Block title="Disclaimer">
          <p className="report-prose">{r.advice.note}</p>
          <p className="report-prose">
            This report is generated from the Swiss Ephemeris using the Lahiri
            ayanamsa and whole sign houses. Every finding in it is produced by a
            fixed rule from the positions above, which means it can be checked
            against a classical text rather than taken on trust. It is offered
            for reflection and for tradition. It is not medical, legal or
            financial advice, it makes no claim about how long anyone will live,
            and no part of it is a reason to delay seeing a doctor.
          </p>
          <p className="report-prose">
            Astrology is not an experimental science. Where this report states
            something as classical doctrine rather than as measurement, it says
            so.
          </p>
        </Block>
      </Page>

      {/* ================================================ 13. CLOSING === */}
      <section className="report-cover-page report-back">
        <Image
          src="/report/om.jpg"
          alt=""
          fill
          className="report-cover-art"
          sizes="(max-width: 800px) 100vw, 800px"
        />
        <div className="report-cover-inner">
          <p className="report-cover-brand">{SITE.name.toUpperCase()}</p>
          <p lang="sa" className="font-display report-back-shloka">
            {SHLOKAS.jyoti.sanskrit}
          </p>
          <p className="report-back-translation">{SHLOKAS.jyoti.translation}</p>

          <div className="report-cover-card">
            <p className="report-back-cta">Cast your own chart, free</p>
            <p className="report-back-url">{SITE.url.replace(/^https?:\/\//, '')}</p>
            <p className="report-cover-foot">
              Birth chart · Panchang · Dasha · Yogas · Transits · Compatibility ·
              Remedies · This full report, in English, Hindi and Bengali
            </p>
            <p className="report-back-social">@{SITE.instagram}</p>
          </div>
        </div>
      </section>

      {/* Ornament, on screen only, to close the scroll. */}
      <div className="no-print flex justify-center py-16" style={{ color: 'var(--color-gold-600)' }}>
        <Ganesha size={28} />
        <Om size={28} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout primitives. Deliberately small and local: they exist to keep the page
// above readable, not to be a design system.
// ---------------------------------------------------------------------------

/**
 * A part divider.
 *
 * Twenty pages of tables without a break reads as a printout rather than as a
 * document. Three of these turn the report into parts that a person can find
 * their way back to, and they are where the rest of the supplied artwork earns
 * its place: full bleed, no data on them, so nothing is lost if a printer
 * strips the background.
 */
function Divider({
  art,
  part,
  title,
  sanskrit,
}: {
  art: string;
  part: string;
  title: string;
  sanskrit: string;
}) {
  return (
    <section className="report-cover-page report-divider">
      <Image src={art} alt="" fill className="report-cover-art" sizes="(max-width: 800px) 100vw, 800px" />
      <div className="report-cover-inner">
        <p className="report-cover-brand">{part}</p>
        <h2 className="report-cover-title font-display">{title}</h2>
        <p className="report-cover-sub">{sanskrit}</p>
      </div>
    </section>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <section className="report-sheet">{children}</section>;
}

function PageHead({ title, sanskrit }: { title: string; sanskrit: string }) {
  return (
    <header className="report-sheet-head">
      <h2 className="font-display">{title}</h2>
      <span>{sanskrit}</span>
    </header>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="report-block">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="report-grid">{children}</dl>;
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-cell">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-cover-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="report-note">{children}</p>;
}

function Finding({ name, reason, meta }: { name: string; reason: string; meta: string }) {
  return (
    <div className="report-finding">
      <p className="report-finding-name">
        {name} <span>{meta}</span>
      </p>
      <p className="report-prose">{reason}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function formatBirthDate(r: ReturnType<typeof buildFullReport>): string {
  return DateTime.fromJSDate(new Date(r.chart.meta.utcISO), {
    zone: r.chart.meta.timezone,
  }).toFormat('d LLLL yyyy');
}

function formatBirthTime(r: ReturnType<typeof buildFullReport>): string {
  if (r.chart.meta.timeUnknown) return 'Not known';
  return DateTime.fromJSDate(new Date(r.chart.meta.utcISO), {
    zone: r.chart.meta.timezone,
  }).toFormat('HH:mm:ss');
}

function time(date: Date | null, zone: string): string {
  return date ? DateTime.fromJSDate(date, { zone }).toFormat('HH:mm:ss') : '—';
}

/**
 * Gender comes straight from the query rather than from the parsed chart,
 * because it plays no part in casting a chart and so is deliberately not
 * carried on ParsedBirthQuery. It is printed only because a traditional kundli
 * prints it.
 */
function genderOf(params: Record<string, string | string[] | undefined>): string {
  const raw = params.gender;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 'Not given';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** A dasha change, as one line. */
function describeChange(change: { date: Date; level: number; entering: string }): string {
  const name = ['mahadasha', 'antardasha', 'pratyantardasha', 'sookshma'][change.level - 1] ?? 'period';
  return `${change.entering} ${name} begins`;
}

function ordinal(n: number): string {
  const suffix =
    n % 10 === 1 && n % 100 !== 11
      ? 'st'
      : n % 10 === 2 && n % 100 !== 12
        ? 'nd'
        : n % 10 === 3 && n % 100 !== 13
          ? 'rd'
          : 'th';
  return `${n}${suffix}`;
}
