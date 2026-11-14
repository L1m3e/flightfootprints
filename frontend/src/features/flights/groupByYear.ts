import type { Flight } from "@/features/flights/api"

export interface YearGroup {
  year: number
  /** In the order they were given, which for the timeline is newest first. */
  flights: Flight[]
  distanceKm: number
}

/**
 * Splits flights into one group per calendar year, newest year first.
 *
 * The year is read from the first four characters of the "YYYY-MM-DD" date instead of
 * going through a Date object, which would shift a flight on 1 January into the
 * previous year for anyone west of Greenwich.
 */
export function groupByYear(flights: Flight[]): YearGroup[] {
  const groups = new Map<number, YearGroup>()
  for (const flight of flights) {
    const year = Number(flight.flightDate.slice(0, 4))
    const group = groups.get(year)
    if (group) {
      group.flights.push(flight)
      group.distanceKm += flight.distanceKm
    } else {
      groups.set(year, { year, flights: [flight], distanceKm: flight.distanceKm })
    }
  }
  return [...groups.values()].sort((a, b) => b.year - a.year)
}
