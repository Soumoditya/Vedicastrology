/**
 * `tz-lookup` ships no types. It exports a single function mapping a
 * coordinate to an IANA time zone identifier, and throws on out-of-range input.
 */
declare module 'tz-lookup' {
  export default function tzLookup(latitude: number, longitude: number): string;
}
