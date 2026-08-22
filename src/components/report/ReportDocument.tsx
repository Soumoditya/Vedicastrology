import { DateTime } from 'luxon';

import type { buildFullReport } from '@/lib/report/build';
import type { ReportTheme } from '@/lib/report/themes';
import { chartToDataUri } from '@/lib/chart-render/svgString';
import { transitsToRenderData } from '@/lib/chart-render/adapt';
import { sarvaVerdict } from '@/lib/astro/ashtakavarga';
import { RASHI_NAMES_EN, RASHI_SYMBOLS } from '@/lib/astro/constants';
import { formatDms } from '@/lib/astro/zodiac';
import { lagnaReading, rashiFraming } from '@/lib/predictions/lagna';
import { nakshatraReading, padaEmphasis } from '@/lib/predictions/nakshatra-reading';
import type { AstroNames } from '@/lib/i18n/astro-names';
import { SHLOKAS } from '@/lib/shlokas';
import { GrahaMark } from '@/components/ornament/GrahaMark';
import { RashiChakra } from '@/components/ornament/RashiChakra';
import { NavagrahaOrbit } from '@/components/ornament/NavagrahaOrbit';

type Report = ReturnType<typeof buildFullReport>;

/*
  The real vocabulary type rather than a hand-written shape of it. The first
  attempt declared `graha: (g: string) => string`, which is wider than
  `AstroNames` actually is — it takes an `AnyGraha` — and a looser hand-copy of
  a type is a lie that only surfaces at the call site.
*/
type Names = AstroNames;

/**
 * The document, once, for both routes.
 *
 * `/report` renders this to be read on screen and `/report/print` renders the
 * same tree inside Paged.js. One source, so the thing somebody reads and the
 * thing somebody prints cannot drift — which they had already begun to, since
 * the screen version and the print version of the covers disagreed about their
 * own height.
 *
 * **Sectioning is the whole design.** Every `<Section>` starts a page and
 * publishes its own title for the running header, so the report's complaint —
 * headings stranded on the first of three physical pages, no way to tell where
 * you were — is answered structurally rather than by guessing at heights. A
 * section is free to be short or to run to four pages; what it may not do is
 * share a page with the next subject.
 *
 * Nothing here sets a height. That was the old bug: `.report-sheet` faked a page
 * with `break-after: page` and no bound, so anything too tall silently spilled
 * and anything too short left the rest of the sheet empty. Content flows, and
 * Paged.js decides where the paper ends.
 */
export function ReportDocument({
  r,
  n,
  theme,
  gender,
}: {
  r: Report;
  n: Names;
  theme: ReportTheme;
  gender: string;
}) {
  const zone = r.chart.meta.timezone;
  const bt = r.birthTime;
  const p = r.panchang;
  const moon = r.chart.byGraha.Moon;

  const lagna = lagnaReading(r.identity.lagnaRashi);
  const rasi = lagnaReading(moon.rashi);
  const star = nakshatraReading(moon.nakshatra);

  const plate = (data: Parameters<typeof chartToDataUri>[0], degrees: boolean) =>
    chartToDataUri(data, { size: 560, palette: theme.chart, showDegrees: degrees });

  const gocharaFromLagna = transitsToRenderData(
    r.transits, 'ascendant', r.chart.ascendant.rashi, 'From the ascendant',
  );
  const gocharaFromMoon = transitsToRenderData(
    r.transits, 'moon', moon.rashi, 'From the Moon',
  );

  const strained = r.remedies.grahas.filter((g) => g.condition === 'strained');
  const fmt = (d: Date) => DateTime.fromJSDate(d).setZone(zone).toFormat('d LLL yyyy');

  return (
    <>
      {/* ============================================================ cover */}
      <div className="rp-plate">
        <p className="rp-plate-brand">Vedic Astrologey</p>
        <div className="rp-plate-ornament">
          <RashiChakra size={200} period={0} />
        </div>
        <h1 className="rp-plate-title">Complete Vedic Reading</h1>
        <p className="rp-plate-sub">Sampūrṇa Jyotiṣa Phala</p>

        <div className="rp-plate-card">
          <Row label="Name" value={r.displayName ?? 'Not given'} />
          <Row label="Date of birth" value={birthDate(r)} />
          <Row label="Time of birth" value={birthTime(r)} />
          <Row label="Place of birth" value={r.chart.meta.place.name} />
          <Row
            label="Report prepared"
            value={DateTime.fromJSDate(r.generatedAt).setZone(zone).toFormat('d LLLL yyyy')}
          />
        </div>
        <p className="rp-plate-foot">vedicastrologey.com · @vedic_astrologey</p>
      </div>

      {/* ========================================================= contents */}
      <nav className="rp-toc">
        <h2 className="rp-section-title">Contents</h2>
        <p className="rp-section-sanskrit">Anukramaṇikā</p>
        <ol>
          {CONTENTS.map((c) => (
            <li key={c.id}>
              <a href={`#${c.id}`}>{c.label}</a>
              <span className="rp-toc-page" data-toc-for={c.id} />
            </li>
          ))}
        </ol>
      </nav>

      {/* ==================================================== birth details */}
      <Section id="birth" title="Birth details" sanskrit="Janma Vivaraṇa">
        <Block title="Basic details">
          <Grid>
            <Cell label="Gender" value={gender} />
            <Cell label="Date of birth" value={birthDate(r)} />
            <Cell label="Day of birth" value={n.vara(p.vara.index)} />
            <Cell label="Time of birth" value={birthTime(r)} />
            <Cell label="Place of birth" value={r.chart.meta.place.name} />
            <Cell label="Latitude" value={`${r.chart.meta.place.latitude.toFixed(4)}°`} />
            <Cell label="Longitude" value={`${r.chart.meta.place.longitude.toFixed(4)}°`} />
            <Cell label="Time zone" value={`${zone} (${bt.zoneOffsetFormatted})`} />
          </Grid>
        </Block>

        <Block title="Birth time, as the tradition reckons it">
          <Grid>
            <Cell label="Ishtkaal" value={bt.ishtakaal?.formatted ?? 'Time not known'} />
            <Cell label="Ishtkaal (clock)" value={bt.ishtakaal?.clock ?? '—'} />
            <Cell label="Local time correction" value={bt.localTimeCorrectionFormatted} />
            <Cell label="War time correction" value={bt.warTimeCorrectionFormatted} />
            <Cell label="LMT at birth" value={bt.lmt} />
            <Cell label="GMT at birth" value={bt.gmt} />
            <Cell label="Sunrise" value={clock(bt.sunrise, zone)} />
            <Cell label="Sunset" value={clock(bt.sunset, zone)} />
            <Cell label="Day duration" value={bt.dayDurationFormatted ?? '—'} />
            <Cell label="Night duration" value={bt.nightDurationFormatted ?? '—'} />
          </Grid>
          <Note>
            Ishtkaal is the time elapsed from sunrise to birth, in ghati and pala.
            One ghati is twenty four minutes. It is the figure a chart was cast
            from before clocks were standardised, and it is printed here so this
            reading can be checked against one worked by hand.
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

        <Block title="Provenance">
          <p className="rp-meta">
            Calculated with the Swiss Ephemeris using the{' '}
            {r.chart.meta.settings.ayanamsa === 'lahiri' ? 'Lahiri (Chitrapaksha)' : r.chart.meta.settings.ayanamsa}{' '}
            ayanamsa at {r.chart.meta.ayanamsaValue.toFixed(6)}°, whole-sign houses and
            the {r.chart.meta.settings.nodeType} lunar node. Local time was converted
            using the offset genuinely in force on the date of birth.
          </p>
        </Block>
      </Section>

      {/* ======================================================== avakhada */}
      <Section id="avakhada" title="Avakhada Chakra" sanskrit="Avakahaḍā Cakra">
        <Grid>
          <Cell label="Varna" value={r.avakhada.varna} />
          <Cell label="Vashya" value={r.avakhada.vashya} />
          <Cell label="Yoni" value={r.avakhada.yoni} />
          <Cell label="Gana" value={r.avakhada.gana} />
          <Cell label="Nadi" value={r.avakhada.nadi} />
          <Cell label="Paya" value={r.avakhada.paya} />
          <Cell label="Lagna" value={n.rashi(r.identity.lagnaRashi)} />
          <Cell label="Lagna lord" value={n.graha(r.identity.lagnaLord)} />
          <Cell label="Rasi" value={n.rashi(moon.rashi)} />
          <Cell label="Rasi lord" value={n.graha(r.identity.rasiLord)} />
          <Cell label="Nakshatra" value={n.nakshatra(moon.nakshatra)} />
          <Cell label="Pada" value={String(r.identity.pada)} />
          <Cell label="Nakshatra lord" value={n.graha(r.identity.nakshatraLord)} />
          <Cell
            label="Dasa balance at birth"
            value={`${n.graha(r.dasha.balance.lord)}: ${r.dasha.balance.years}y ${r.dasha.balance.months}m ${r.dasha.balance.days}d`}
          />
        </Grid>
        <Note>
          Varna here is a temperament grouping derived from the Moon sign. It has
          nothing to do with caste or birth in the social sense, and it is worth
          saying so plainly rather than leaving the word to be read the other way.
        </Note>
      </Section>

      {/* ====================================================== favourable */}
      <Section id="favourable" title="Favourable points" sanskrit="Śubha Vicāra">
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
            the Moon sign, which is the traditional derivation. It is not invented
            per person, and the derivation is given so it can be checked.
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
      </Section>

      {/* =========================================================== lagna */}
      <Section id="lagna" title="Your ascendant" sanskrit="Lagna">
        <p className="rp-lede">
          The sign rising on the eastern horizon at the moment of birth. It is read
          as the body and the bearing — how you meet the world and how the world
          first reads you — and its lord is the graha whose condition matters most
          in the whole chart.
        </p>
        <p className="rp-meta">
          Ascendant: <strong>{n.rashi(r.identity.lagnaRashi)}</strong> · lord{' '}
          {n.graha(r.identity.lagnaLord)} · {lagna.element}, {lagna.modality} ·
          governs {lagna.governs} · {formatDms(r.chart.ascendant.degreeInRashi)}
        </p>

        <Block title="How you are read">
          <p className="rp-prose">{lagna.bearing}</p>
        </Block>
        <Block title="Temperament">
          <p className="rp-prose">{lagna.temperament}</p>
        </Block>
        <Block title="Constitution">
          <p className="rp-prose">{lagna.constitution}</p>
          <Note>
            This says where the tradition puts a sign&rsquo;s attention, never what is
            wrong with anybody. Jyotiṣa has nothing to say about a diagnosis, and
            nothing here is a reason to delay asking a doctor about something that
            concerns you.
          </Note>
        </Block>
      </Section>

      {/* =========================================================== rashi */}
      <Section id="rashi" title="Your moon sign" sanskrit="Rāśi">
        <p className="rp-lede">{rashiFraming(moon.rashi)}</p>
        <p className="rp-meta">
          Moon sign: <strong>{n.rashi(moon.rashi)}</strong> · lord{' '}
          {n.graha(r.identity.rasiLord)} · {rasi.element}, {rasi.modality} ·{' '}
          {formatDms(moon.degreeInRashi)} · {n.nakshatra(moon.nakshatra)} pada{' '}
          {r.identity.pada}
        </p>

        <Block title="The inner weather">
          <p className="rp-prose">{rasi.bearing}</p>
          <p className="rp-prose">{rasi.temperament}</p>
        </Block>
        <Note>
          In Indian practice the Moon sign is the one used for daily prediction and
          for matching, which is why you are often given a different sign here than
          the one you know from a newspaper — that one is the Sun sign, and it is
          read in a Western frame.
        </Note>
      </Section>

      {/* ======================================================= nakshatra */}
      <Section id="nakshatra" title="Your birth star" sanskrit="Nakṣatra">
        <p className="rp-lede">
          The nakshatra is the older layer of the system, and the one a traditional
          astrologer reaches for first when asked what somebody is like. Twenty
          seven divisions of the ecliptic, each quartered into padas, read from
          where the Moon stood at birth.
        </p>
        <p className="rp-meta">
          Birth star: <strong>{n.nakshatra(moon.nakshatra)}</strong>, pada{' '}
          {r.identity.pada} · lord {n.graha(r.identity.nakshatraLord)} · deity{' '}
          {star.deity} · symbol {star.symbol} · {star.gana} gaṇa · {star.yoni} yoni
        </p>

        <Block title="Nature">
          <p className="rp-prose">{star.nature}</p>
        </Block>
        <Block title="Work and income">
          <p className="rp-prose">{star.work}</p>
        </Block>
        <Block title="What it costs">
          <p className="rp-prose">{star.caution}</p>
        </Block>
        <Block title="Your pada">
          <p className="rp-prose">
            You were born in {padaEmphasis(r.identity.pada)}.
          </p>
          <Note>
            The nakshatra lord is what sets the Vimshottari dasha sequence running,
            so this one graha decides the order in which a whole life unfolds —
            a larger claim than it first sounds, and the reason this page comes
            before the periods.
          </Note>
        </Block>
      </Section>

      {/* ================================================== part one plate */}
      <Divider part="Part one" title="The chart itself" sanskrit="Kuṇḍalī" />

      {r.charts.map((c) => (
        <ChartPages
          key={c.code}
          code={c.code}
          title={c.title}
          note={c.note}
          uri={plate(c.data, c.code === 'D1')}
          r={r}
          n={n}
        />
      ))}

      {/* ==================================================== yogas/doshas */}
      <Section id="yogas" title="What the chart forms" sanskrit="Yoga">
        {r.yogas.yogas.length === 0 ? (
          <p className="rp-prose">
            No classical yoga is formed in this chart by the definitions this engine
            checks. That is a common result and it is reported rather than padded.
          </p>
        ) : (
          r.yogas.yogas.map((y) => (
            <Finding key={y.name} name={y.name} meta={y.involvedGrahas.join(', ')} reason={y.reason} />
          ))
        )}
      </Section>

      <Section id="doshas" title="Afflictions" sanskrit="Doṣa">
        {r.yogas.doshas.length === 0 ? (
          <p className="rp-prose">No affliction is detected in this chart.</p>
        ) : (
          r.yogas.doshas.map((d) => (
            <Finding key={d.name} name={d.name} meta={d.involvedGrahas.join(', ')} reason={d.reason} />
          ))
        )}

        <Block title="Mangal dosha">
          <p className="rp-verdict">
            {!r.manglik.present ? 'Not present' : r.manglik.cancelled ? 'Present but cancelled' : 'Present'}
          </p>
          {r.manglik.present && (
            <p className="rp-prose">
              Mars falls in a dosha house counted from the{' '}
              {[r.manglik.fromAscendant && 'ascendant', r.manglik.fromMoon && 'Moon',
                r.manglik.fromVenus && 'Venus'].filter(Boolean).join(', the ')}.
            </p>
          )}
          {r.manglik.cancelled && r.manglik.cancellationReasons.length > 0 && (
            <ul className="rp-list">
              {r.manglik.cancellationReasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          )}
        </Block>

        <Block title="Kalsarpa">
          <p className="rp-verdict">
            {r.yogas.kalsarpa.present ? (r.yogas.kalsarpa.typeName ?? 'Present') : 'Not present'}
          </p>
          <Note>
            Kalsarpa does not appear in the classical texts. It is a twentieth
            century addition to popular astrology and many practising astrologers
            give it no weight at all. It is shown because people ask about it,
            described as what it is claimed to mean rather than as established
            doctrine.
          </Note>
        </Block>
      </Section>

      {/* ================================================== part two plate */}
      <Divider part="Part two" title="Your life, area by area" sanskrit="Bhāva Phala" />

      {r.lifeAreas.map((area) => (
        <Section key={area.key} id={`area-${area.key}`} title={area.title} sanskrit="Bhāva">
          <p className="rp-meta">
            Houses {area.houses.join(', ')} · karaka {n.graha(area.karaka)}
          </p>
          {area.findings.map((f, i) => (
            <p key={i} className="rp-prose">{f}</p>
          ))}
        </Section>
      ))}

      {/* ================================================ part three plate */}
      <Divider part="Part three" title="Time, and what is running" sanskrit="Daśā · Gochara" />

      <Section id="dasha" title="The periods of your life" sanskrit="Viṁśottarī Daśā">
        <p className="rp-prose">
          At birth {r.dasha.balance.years} years, {r.dasha.balance.months} months and{' '}
          {r.dasha.balance.days} days of the {n.graha(r.dasha.balance.lord)} mahadasha
          remained. Every date below follows from that one figure, which is itself
          fixed by the Moon&rsquo;s position within its nakshatra.
        </p>
        {r.dasha.current && <p className="rp-prose">Running now: {r.dasha.current}.</p>}

        <table className="rp-table">
          <thead>
            <tr><th>Mahadasha</th><th>From</th><th>To</th><th className="rp-num">Years</th></tr>
          </thead>
          <tbody>
            {r.dasha.mahadashas.map((d) => (
              <tr key={`${d.lord}-${d.start.toISOString()}`}>
                <td>{n.graha(d.lord)}</td>
                <td>{fmt(d.start)}</td>
                <td>{fmt(d.end)}</td>
                <td className="rp-num">{spanYears(d.start, d.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="dasha-next" title="The next ten years" sanskrit="Antardaśā">
        <table className="rp-table">
          <thead><tr><th>Date</th><th>Change</th></tr></thead>
          <tbody>
            {r.dasha.upcoming.map((c, i) => (
              <tr key={i}>
                <td>{fmt(c.date)}</td>
                <td>{describeChange(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ========================================================= gochara */}
      <Section id="gochara" title="Where the sky is now" sanskrit="Gochara">
        <p className="rp-lede">
          Today&rsquo;s positions laid on the houses of the birth chart, counted twice.
          The ascendant is the frame people expect; the Moon is the frame the
          classical table of favourable houses was actually written for, and
          reading that table from the ascendant instead is the commonest way to
          get a transit reading quietly wrong.
        </p>

        <div className="rp-chart-pair">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plate(gocharaFromMoon, false)} alt="Transits from the Moon" />
            <p className="rp-chart-caption">
              From the Moon · {RASHI_NAMES_EN[moon.rashi]} chandra lagna
            </p>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plate(gocharaFromLagna, false)} alt="Transits from the ascendant" />
            <p className="rp-chart-caption">
              From the ascendant · {RASHI_NAMES_EN[r.chart.ascendant.rashi]} lagna
            </p>
          </div>
        </div>

        <table className="rp-table">
          <thead>
            <tr>
              <th>Graha</th><th>Position</th>
              <th className="rp-num">From Moon</th>
              <th className="rp-num">From lagna</th>
              <th>Gochara</th>
            </tr>
          </thead>
          <tbody>
            {r.gochara.lines.map((l) => (
              <tr key={l.graha}>
                <td>{n.graha(l.graha)}{l.retrograde ? ' ℞' : ''}</td>
                <td>{n.rashi(l.rashi)}</td>
                <td className="rp-num">{l.houseFromMoon}</td>
                <td className="rp-num">{l.houseFromAscendant}</td>
                <td>{l.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="gochara-reading" title="What today reads as" sanskrit="Gochara Phala">
        {r.gochara.paragraphs.map((para, i) => (
          <p key={i} className="rp-prose">{para}</p>
        ))}
        <Note>{r.gochara.note}</Note>
      </Section>

      {/* ======================================================= sade sati */}
      <Section id="sade-sati" title="Saturn over your Moon" sanskrit="Sāḍe Sātī">
        <p className="rp-verdict">
          {r.sadeSati.active && r.sadeSati.currentPhase
            ? `Running now, ${r.sadeSati.currentPhase.phase} phase`
            : 'Not running'}
        </p>
        {r.sadeSati.active && r.sadeSati.currentPhase && (
          <p className="rp-prose">
            Saturn is in {n.rashi(r.sadeSati.currentPhase.rashi)}, from{' '}
            {fmt(r.sadeSati.currentPhase.start)} to {fmt(r.sadeSati.currentPhase.end)}.
          </p>
        )}
        {r.sadeSati.dhaiya.active && (
          <p className="rp-prose">
            Saturn is also in the {r.sadeSati.dhaiya.type === 'kantaka' ? 'fourth' : 'eighth'} from
            the Moon — the smaller {r.sadeSati.dhaiya.type} panoti, two and a half
            years rather than seven and a half.
          </p>
        )}

        {r.sadeSati.phases.length > 0 && (
          <table className="rp-table">
            <thead><tr><th>Phase</th><th>Saturn in</th><th>From</th><th>To</th></tr></thead>
            <tbody>
              {r.sadeSati.phases.map((ph) => (
                <tr key={`${ph.phase}-${ph.start.toISOString()}`}>
                  <td>{ph.phase}</td>
                  <td>{n.rashi(ph.rashi)}</td>
                  <td>{fmt(ph.start)}</td>
                  <td>{fmt(ph.end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Note>
          Sade Sati is not a sentence. Roughly one person in four is in it at any
          moment, which is far too many for it to explain a single person&rsquo;s
          difficulty on its own. It describes a period of weight and consolidation,
          and it is read alongside the running dasha, never instead of it.
        </Note>
      </Section>

      {/* ==================================================== ashtakavarga */}
      <Section id="ashtakavarga" title="Sign strength" sanskrit="Aṣṭakavarga">
        <Block title="Sarvashtakavarga">
          <table className="rp-table">
            <thead>
              <tr><th>Sign</th><th className="rp-num">Bindus</th><th>Reading</th></tr>
            </thead>
            <tbody>
              {r.ashtakavarga.sarva.map((bindus, i) => (
                <tr key={i}>
                  <td>{RASHI_SYMBOLS[i]} {n.rashi(i)}</td>
                  <td className="rp-num">{bindus}</td>
                  <td>{sarvaVerdict(bindus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>

        <Block title="Bhinnashtakavarga, graha by graha">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Graha</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="rp-num">{i + 1}</th>
                ))}
                <th className="rp-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {r.ashtakavarga.charts.map((c) => (
                <tr key={c.graha}>
                  <td>{n.graha(c.graha)}</td>
                  {c.bindus.map((b, i) => (
                    <td key={i} className="rp-num">{b}</td>
                  ))}
                  <td className="rp-num">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>
            Each graha contributes bindus to the twelve signs, and the sarva is
            their sum. A transit across a sign holding six or more is supported;
            across one holding two or fewer it is not. This is the only place in
            classical practice that grades a transit numerically, which is why the
            gochara pages lean on it.
          </Note>
        </Block>
      </Section>

      {/* ================================================ part four plate */}
      <Divider part="Part four" title="What to do about it" sanskrit="Upāya" />

      <Section id="remedies" title="Every graha, and what helps it" sanskrit="Graha Vicāra">
        <p className="rp-prose">
          {strained.length === 0
            ? 'No graha in this chart is debilitated, combust, in a difficult house or named in an affliction. Nothing below is repair work — it is all practice.'
            : `${strained.length} graha${strained.length === 1 ? ' is' : 's are'} under pressure in this chart, and ${strained.length === 1 ? 'it is' : 'they are'} listed first.`}
        </p>

        {r.remedies.grahas.map((g) => (
          <div key={g.graha} className="rp-block">
            <div className="rp-graha-head">
              <GrahaMark graha={g.graha} size={30} ns="rpt" decorative />
              <h3>{n.graha(g.graha)}</h3>
            </div>
            <p className="rp-meta">{g.reasons.join(' ')}</p>
            <p className="rp-prose">{g.practical}</p>
            <ul className="rp-list">
              {g.measures.map((m, i) => <li key={i}>{m.action}</li>)}
            </ul>
          </div>
        ))}
      </Section>

      <Section id="gemstones" title="Gemstones" sanskrit="Ratna">
        <p className="rp-prose">
          {r.gemstones.indicated.length === 0
            ? 'A strengthening stone is prescribed for a graha under pressure, and this chart holds none. Anyone selling you one on the strength of this chart is not reading it.'
            : `Named for ${r.gemstones.indicated.map((e) => n.graha(e.graha)).join(', ')}, because those are the grahas this chart holds under pressure.`}
        </p>
        <table className="rp-table">
          <thead>
            <tr><th>Graha</th><th>Stone</th><th>Metal</th><th>Finger</th><th>Day</th><th>This chart</th></tr>
          </thead>
          <tbody>
            {r.gemstones.entries.map((e) => (
              <tr key={e.graha}>
                <td>{n.graha(e.graha)}</td>
                <td>{e.convention.stone}</td>
                <td>{e.convention.metal}</td>
                <td>{e.convention.finger}</td>
                <td>{e.convention.day}</td>
                <td>{e.indicated ? 'Indicated' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>{r.gemstones.caveat}</Note>
      </Section>

      <Section id="advice" title="Practical advice" sanskrit="Vyāvahārika">
        {r.advice.practical.map((item, i) => (
          <div key={i} className="rp-advice">
            <p className="rp-finding-name">{item.area}</p>
            <p className="rp-prose">{item.body}</p>
            <p className="rp-meta">{item.because}</p>
          </div>
        ))}
      </Section>

      <Section id="religious" title="Religious practice" sanskrit="Iṣṭa Devatā">
        <p className="rp-prose">{r.advice.religious.derivation}</p>
        <Grid>
          <Cell label="Atmakaraka" value={n.graha(r.advice.religious.atmakaraka)} />
          <Cell label="Ishta graha" value={n.graha(r.advice.religious.ishtaGraha)} />
          <Cell label="Ishta devata" value={r.advice.religious.ishtaDevata} />
          <Cell label="Fasting day" value={r.advice.religious.fastingDay} />
          <Cell label="Direction" value={r.advice.religious.direction} />
          <Cell label="Mantra" value={r.advice.religious.mantra} />
        </Grid>
        <ul className="rp-list">
          {r.advice.religious.practices.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </Section>

      <Section id="disclaimer" title="What this document is" sanskrit="Nivedana">
        <p className="rp-prose">{r.advice.note}</p>
        <p className="rp-prose">{r.remedies.note}</p>
        <p className="rp-prose">
          Every figure here is computed from the birth details on the cover, by
          fixed rules, with the working shown. The interpretations are traditional
          attributions written out in advance and keyed to what the calculation
          found — not generated for you at the moment you asked, and not a
          prediction of events. Where anything here touches your health, your money
          or your legal position, it is general and it is not a substitute for
          asking somebody qualified.
        </p>
      </Section>

      {/* ======================================================= back plate */}
      <div className="rp-plate">
        <div className="rp-plate-ornament">
          <NavagrahaOrbit size={190} />
        </div>
        <p className="rp-shloka">{SHLOKAS.varahamihira.sanskrit}</p>
        <p className="rp-shloka-tr">{SHLOKAS.varahamihira.translation}</p>
        <p className="rp-shloka-src">{SHLOKAS.varahamihira.source}</p>
        <p className="rp-plate-foot">
          vedicastrologey.com · cast your own chart, free · @vedic_astrologey
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

/**
 * A chart and its reading, as two pages.
 *
 * Asked for explicitly: the plate deserves a page to itself at a size somebody
 * can actually read, and the interpretation deserves not to be crammed under it.
 * D1 additionally carries the graha table, because that table *is* the reading of
 * the rashi chart and belongs beside it rather than in a section of its own.
 */
function ChartPages({
  code, title, note, uri, r, n,
}: {
  code: string; title: string; note: string; uri: string; r: Report; n: Names;
}) {
  return (
    <>
      <Section id={`${code.toLowerCase()}-chart`} title={title} sanskrit={code}>
        <div className="rp-chart">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uri} alt={title} />
        </div>
        <Note>{note}</Note>
      </Section>

      <Section id={`${code.toLowerCase()}-reading`} title={`${title} — read`} sanskrit={code}>
        {code === 'D1' ? (
          <table className="rp-table">
            <thead>
              <tr>
                <th>Graha</th><th>Rashi</th><th>Position</th>
                <th className="rp-num">House</th><th>Dignity</th><th>State</th>
              </tr>
            </thead>
            <tbody>
              {r.chart.planets.map((pl) => (
                <tr key={pl.graha}>
                  <td>{n.graha(pl.graha)}</td>
                  <td>{n.rashi(pl.rashi)}</td>
                  <td>{formatDms(pl.degreeInRashi)}</td>
                  <td className="rp-num">{pl.house}</td>
                  <td>{n.dignity(pl.dignity)}</td>
                  <td>
                    {[pl.retrograde && 'retrograde', pl.combust && 'combust']
                      .filter(Boolean).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rp-prose">
            A divisional chart is read for its own subject only. Judge a graha here
            by the company it keeps and the sign it falls in, and read the result
            against the rashi chart rather than instead of it — a finding that
            contradicts the D1 outright is usually a finding that has been
            over-read.
          </p>
        )}

        <Block title="Where the grahas fall">
          <table className="rp-table">
            <thead><tr><th>House</th><th>Sign</th><th>Grahas</th></tr></thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const src = code === 'D1' ? r.charts[0] : r.charts.find((c) => c.code === code);
                const house = src?.data.houses.find((x) => x.house === h);
                return (
                  <tr key={h}>
                    <td className="rp-num">{h}</td>
                    <td>{house ? n.rashi(house.rashi) : '—'}</td>
                    <td>{house && house.grahas.length
                      ? house.grahas.map((g) => n.graha(g.graha)).join(', ')
                      : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Block>
      </Section>
    </>
  );
}

/**
 * A part divider.
 *
 * Drawn, on every ground including the dark one. The four `public/report/*.jpg`
 * plates that used to fill these pages are 900×1600 against a page of 0.687, so
 * `object-fit: cover` cropped about eighteen per cent off the top and bottom of
 * each — the "images cut in half" that was reported. An ornament built from the
 * site's own geometry cannot be cropped by arithmetic, and it prints.
 */
function Divider({ part, title, sanskrit }: { part: string; title: string; sanskrit: string }) {
  return (
    <div className="rp-plate">
      <div className="rp-plate-ornament">
        <RashiChakra size={170} period={0} />
      </div>
      <p className="rp-plate-brand">{part}</p>
      <h2 className="rp-plate-title">{title}</h2>
      <p className="rp-plate-sub">{sanskrit}</p>
    </div>
  );
}

function Section({
  id, title, sanskrit, children,
}: { id: string; title: string; sanskrit: string; children: React.ReactNode }) {
  return (
    <section className="rp-section" id={id}>
      <h2 className="rp-section-title">{title}</h2>
      <p className="rp-section-sanskrit">{sanskrit}</p>
      {children}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rp-block">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="rp-grid">{children}</dl>;
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rp-cell">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rp-plate-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rp-note">{children}</p>;
}

function Finding({ name, meta, reason }: { name: string; meta: string; reason: string }) {
  return (
    <div className="rp-finding">
      <p className="rp-finding-name">{name} <span>{meta}</span></p>
      <p className="rp-prose">{reason}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

/**
 * The contents, listed once.
 *
 * Hand-written rather than derived, because deriving it would mean rendering the
 * document twice. The page numbers are not hand-written — `target-counter()` in
 * the paged stylesheet reads the real page each anchor landed on, which is the
 * one thing a manual contents page can never keep correct.
 */
const CONTENTS = [
  { id: 'birth', label: 'Birth details' },
  { id: 'avakhada', label: 'Avakhada Chakra' },
  { id: 'favourable', label: 'Favourable points' },
  { id: 'lagna', label: 'Your ascendant' },
  { id: 'rashi', label: 'Your moon sign' },
  { id: 'nakshatra', label: 'Your birth star' },
  { id: 'd1-chart', label: 'Rāśi chart (D1)' },
  { id: 'd1-reading', label: 'Rāśi chart, read' },
  { id: 'd9-chart', label: 'Navāṁśa chart (D9)' },
  { id: 'd9-reading', label: 'Navāṁśa chart, read' },
  { id: 'd10-chart', label: 'Daśāṁśa chart (D10)' },
  { id: 'd10-reading', label: 'Daśāṁśa chart, read' },
  { id: 'yogas', label: 'What the chart forms' },
  { id: 'doshas', label: 'Afflictions' },
  { id: 'dasha', label: 'The periods of your life' },
  { id: 'dasha-next', label: 'The next ten years' },
  { id: 'gochara', label: 'Where the sky is now' },
  { id: 'gochara-reading', label: 'What today reads as' },
  { id: 'sade-sati', label: 'Saturn over your Moon' },
  { id: 'ashtakavarga', label: 'Sign strength' },
  { id: 'remedies', label: 'Every graha, and what helps it' },
  { id: 'gemstones', label: 'Gemstones' },
  { id: 'advice', label: 'Practical advice' },
  { id: 'religious', label: 'Religious practice' },
  { id: 'disclaimer', label: 'What this document is' },
];

function birthDate(r: Report): string {
  return DateTime.fromJSDate(new Date(r.chart.meta.utcISO), {
    zone: r.chart.meta.timezone,
  }).toFormat('d LLLL yyyy');
}

function birthTime(r: Report): string {
  if (r.chart.meta.timeUnknown) return 'Not known';
  return DateTime.fromJSDate(new Date(r.chart.meta.utcISO), {
    zone: r.chart.meta.timezone,
  }).toFormat('HH:mm:ss');
}

function clock(date: Date | null, zone: string): string {
  return date ? DateTime.fromJSDate(date, { zone }).toFormat('HH:mm:ss') : '—';
}

/** A period's length in years, to one decimal, from its own dates. */
function spanYears(start: Date, end: Date): string {
  return ((end.getTime() - start.getTime()) / (365.25 * 86_400_000)).toFixed(1);
}

function describeChange(change: { date: Date; level: number; entering: string }): string {
  const name =
    ['mahadasha', 'antardasha', 'pratyantardasha', 'sookshma'][change.level - 1] ?? 'period';
  return `${change.entering} ${name} begins`;
}
