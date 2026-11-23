import type { Airline } from "@/features/flights/api"

/**
 * The airline part of a flight number: "CA" in "CA818". A flight number that starts with
 * three letters carries an ICAO designator instead: "CCA" in "CCA818". IATA designators
 * may contain a digit ("9C8887", "3U8888"), so the first two characters are taken as
 * they are.
 */
export function airlineDesignator(flightNo: string | null | undefined): string | null {
  const code = (flightNo ?? "").replaceAll(" ", "").toUpperCase()
  if (/^[A-Z]{3}\d/.test(code)) return code.slice(0, 3)
  return code.length >= 2 ? code.slice(0, 2) : null
}

/** The airline a flight number belongs to, if its designator is one of the known ones. */
export function airlineOfFlightNo(
  airlines: readonly Airline[],
  flightNo: string | null | undefined,
): Airline | undefined {
  const designator = airlineDesignator(flightNo)
  if (!designator) return undefined
  return airlines.find((airline) => airline.iata === designator || airline.icao === designator)
}

/** An airline's name in the language of the interface. Not every airline has a Chinese name. */
export function airlineName(airline: Airline, language: string): string {
  return language.startsWith("zh") ? (airline.nameZh ?? airline.name) : airline.name
}
