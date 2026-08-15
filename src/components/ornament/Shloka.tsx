import { SHLOKAS } from '@/lib/shlokas';

/**
 * A Sanskrit verse, set the way a verse should be set.
 *
 * The Devanagari leads, in the display size, because it is the thing. The
 * transliteration sits under it for anyone who does not read the script, and
 * the translation and source are quiet beneath. This is not decoration: a real
 * verse from a named source, shown in full, is exactly the register the site is
 * meant to have.
 */
export function Shloka({
  which,
  align = 'center',
  className,
}: {
  which: keyof typeof SHLOKAS;
  align?: 'center' | 'left';
  className?: string;
}) {
  const shloka = SHLOKAS[which];
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <figure className={`flex flex-col ${alignment} ${className ?? ''}`}>
      <p
        lang="sa"
        className="font-display text-[clamp(1.25rem,2.6vw,1.75rem)] leading-[1.7]"
        style={{ color: 'var(--color-gold-200)', whiteSpace: 'pre-line' }}
      >
        {shloka.sanskrit}
      </p>

      <p
        className="font-quote mt-4 text-[0.95rem] italic leading-relaxed"
        style={{ color: 'var(--color-gold-500)', whiteSpace: 'pre-line' }}
      >
        {shloka.transliteration}
      </p>

      <figcaption
        className="mt-5 max-w-md text-sm leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {shloka.translation}
        <cite
          className="mt-1.5 block text-xs not-italic"
          style={{ color: 'var(--text-muted)' }}
        >
          {shloka.source}
        </cite>
      </figcaption>
    </figure>
  );
}
