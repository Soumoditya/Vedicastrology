/**
 * Fixed vocabularies for the research fields.
 *
 * These mirror the CHECK constraints in
 * `supabase/migrations/20260729001000_research_life_events.sql`. If you add an
 * option here, add it there too, or the insert will be refused.
 *
 * Fixed categories rather than free text is a deliberate research decision:
 * free text becomes a thousand unique job titles and stops being groupable,
 * which is exactly what makes the field worthless for analysis.
 */

export const MARITAL_STATUS = [
  { value: 'single', label: 'Single' },
  { value: 'partnered', label: 'In a relationship' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced or separated' },
  { value: 'widowed', label: 'Widowed' },
] as const;

export const EDUCATION_LEVEL = [
  { value: 'school', label: 'School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's degree" },
  { value: 'masters', label: "Master's degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Occupation groups.
 *
 * Chosen to line up with what the classical texts actually distinguish
 * (government service, trade, healing, teaching, land) rather than with a
 * modern census, since the point is to test those texts.
 */
export const OCCUPATION_CATEGORY = [
  { value: 'business', label: 'Business or self-employed' },
  { value: 'government', label: 'Government or public service' },
  { value: 'medicine', label: 'Medicine or healthcare' },
  { value: 'engineering_tech', label: 'Engineering or technology' },
  { value: 'education', label: 'Teaching or research' },
  { value: 'law', label: 'Law' },
  { value: 'arts_media', label: 'Arts or media' },
  { value: 'finance', label: 'Finance or accounting' },
  { value: 'agriculture', label: 'Agriculture or land' },
  { value: 'trades', label: 'Skilled trades' },
  { value: 'service', label: 'Service industry' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'spiritual', label: 'Spiritual or religious life' },
  { value: 'other', label: 'Other' },
] as const;

export const GENDER = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'undisclosed', label: 'Prefer not to say' },
] as const;

/**
 * Parse a list of years typed as "2011, 2018 2022".
 *
 * Accepts commas, spaces or new lines, because insisting on one separator only
 * creates a form people get wrong. Anything outside the ephemeris range is
 * dropped rather than rejected, so one typo does not lose the whole answer.
 */
export function parseYears(input: string | null | undefined): number[] {
  if (!input) return [];

  return [
    ...new Set(
      input
        .split(/[\s,;]+/)
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((year) => Number.isInteger(year) && year >= 1800 && year <= 2400),
    ),
  ].sort((a, b) => a - b);
}
