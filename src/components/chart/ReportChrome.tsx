import { Ganesha, Om } from '@/components/ornament/Ornaments';
import { SHLOKAS } from '@/lib/shlokas';
import { SITE } from '@/lib/site';

/**
 * The cover and footer of a printed report.
 *
 * Both render only on paper. On screen they are nothing, so a page is never
 * cluttered with a redundant masthead. On paper they turn a print-out into a
 * report someone keeps and passes on, which is the point: a chart shared with a
 * friend carries the site's name and address on every sheet. That is the
 * advertisement the user asked the report to be, done with restraint rather than
 * a banner.
 */

export function ReportCover({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const shloka = SHLOKAS.ganesha;

  return (
    <header className="print-only report-cover">
      <div style={{ display: 'flex', justifyContent: 'center', color: '#8c6e1b' }}>
        <Ganesha size={40} />
      </div>

      <p
        style={{ margin: '4px 0 0', fontSize: '9pt', letterSpacing: '3px', color: '#8c6e1b' }}
      >
        {SITE.name.toUpperCase()}
      </p>

      <h1 className="font-display" style={{ margin: '6px 0 0', fontSize: '20pt', color: '#16130c' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: '3px 0 0', fontSize: '10pt', color: '#3a342a' }}>{subtitle}</p>
      )}

      {/* The invocation, since a reading is an undertaking begun. */}
      <p
        lang="sa"
        className="font-display"
        style={{ margin: '8px 0 0', fontSize: '11pt', color: '#8c6e1b' }}
      >
        {shloka.sanskrit.split('\n')[0]}
      </p>
    </header>
  );
}

export function ReportFooter() {
  return (
    <footer className="print-only report-ad">
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Om size={12} />
        Cast your own chart, free, at {SITE.url.replace(/^https?:\/\//, '')}
      </span>
      <span>@{SITE.instagram}</span>
    </footer>
  );
}
