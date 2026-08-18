/**
 * Round a generated SVG coordinate so the server and the browser agree.
 *
 * `Math.sin` and `Math.cos` are implementation-defined to within a unit in the
 * last place, and Node's V8 and the browser's V8 do not always land on the same
 * bit. React then serialises two slightly different doubles into two different
 * attribute strings and reports a hydration mismatch:
 *
 *   server  y1="6.906733260263396"
 *   client  y1={6.9067332602633975}
 *
 * That is not a cosmetic warning. React abandons patching the subtree it happens
 * in, so the ornament it affects stops being interactive and any later update to
 * it is silently dropped. Two of these were firing on every page load, from the
 * wordmark and the hero yantra.
 *
 * Three decimals is finer than a hair at any size these are drawn, and it makes
 * both engines produce the same string from the same angle.
 */
export function svgCoord(n: number): number {
  return Number(n.toFixed(3));
}
