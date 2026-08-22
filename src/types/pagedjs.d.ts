/**
 * Types for Paged.js.
 *
 * The package ships none. Only the surface actually used is declared; guessing
 * at the rest would be inventing an API contract nobody checked. Note that
 * `next.config.ts` aliases this specifier onto `dist/paged.esm.js` — see the
 * note there for why the package entry cannot be used.
 */
declare module 'pagedjs' {
  /** What `preview()` resolves to once the document has been fragmented. */
  export interface PagedFlow {
    /** Number of pages produced. */
    total: number;
    /** The generated page elements, in order. */
    pages: HTMLElement[];
    /** Milliseconds the layout pass took. */
    performance: number;
  }

  export class Previewer {
    /**
     * Fragment `content` into pages inside `renderTo`.
     *
     * `stylesheets` are additional sheets to parse for `@page` rules; sheets
     * already in the document are picked up without being listed.
     */
    preview(
      content: string | HTMLElement,
      stylesheets?: (string | Record<string, string>)[],
      renderTo?: HTMLElement,
    ): Promise<PagedFlow>;

    on(event: string, listener: (...args: unknown[]) => void): void;
  }
}
