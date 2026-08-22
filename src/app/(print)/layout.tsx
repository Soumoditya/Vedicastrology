/**
 * The print route's layout: nothing.
 *
 * `/report/print` is not a page of the site, it is a document. The site header,
 * the footer, the theme toggle and the account menu are all furniture that would
 * have to be hidden again with `.no-print` and would still be visible on screen
 * above the paginated sheets — which is exactly the state the old report was in.
 *
 * Kept out of the `(site)` group rather than hidden inside it, so nothing has to
 * be undone. The route also forces the light theme onto the document element:
 * the report carries its own four grounds and has no business inheriting the
 * site's dark mode underneath them.
 */
const forceLight = `
(function () {
  try { document.documentElement.dataset.theme = 'light'; } catch (e) {}
})();
`;

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: forceLight }} />
      {children}
    </>
  );
}
