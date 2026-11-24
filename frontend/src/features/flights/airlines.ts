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
export function airlineName(airline: { name: string; nameZh: string | null }, language: string): string {
  return language.startsWith("zh") ? (airline.nameZh ?? airline.name) : airline.name
}

/** Spaces and punctuation that are skipped when two names are compared. */
const IGNORED = /[ \u3000.,\-'\u2019()\uFF08\uFF09\u00B7]/g

/** The form in which names are compared: lower case, without spaces and punctuation. */
function comparable(text: string): string {
  return text.toLowerCase().replace(IGNORED, "")
}

/** Per list of airlines: every name and code in its comparable form. Null marks one that two airlines share. */
const indexes = new WeakMap<readonly Airline[], Map<string, Airline | null>>()

function indexOf(airlines: readonly Airline[]): Map<string, Airline | null> {
  let index = indexes.get(airlines)
  if (!index) {
    index = new Map()
    for (const airline of airlines) {
      for (const label of [airline.iata, airline.icao, airline.name, airline.nameZh, ...airline.aliases]) {
        const key = label ? comparable(label) : ""
        if (key === "") continue
        const other = index.get(key)
        index.set(key, other === undefined || other === airline ? airline : null)
      }
    }
    indexes.set(airlines, index)
  }
  return index
}

/**
 * The airline that a piece of text means: a code, the English or the Chinese name, or
 * another name the airline is known by. Upper and lower case, spaces and punctuation
 * make no difference. The backend looks airlines up in the same way; this copy lets the
 * form say what it understood while the user is still typing.
 */
export function findAirline(airlines: readonly Airline[], text: string | null | undefined): Airline | undefined {
  return indexOf(airlines).get(comparable(text ?? "")) ?? undefined
}
