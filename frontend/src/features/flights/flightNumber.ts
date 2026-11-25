/**
 * Airline designator, up to four digits, optional letter. The backend checks the same
 * shape; this copy gives the form instant feedback and lets it decide when to enable the
 * lookup button.
 */
export const FLIGHT_NO_PATTERN = /^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/

/** Spaces are forgiven and the number is case-insensitive, as on a boarding pass. */
export function normalizeFlightNo(value: string): string {
  return value.replaceAll(" ", "").toUpperCase()
}
