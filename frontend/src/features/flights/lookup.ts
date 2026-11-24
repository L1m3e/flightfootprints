import { api } from "@/lib/api"
import { AIRCRAFT_TYPES, aircraftTypeOf } from "@/features/aircraft/aircraftTypes"
import { airlineName } from "@/features/flights/airlines"
import type { Airport, FlightLookup } from "@/features/flights/api"
import { normalizeFlightNo } from "@/features/flights/flightNumber"

/** The query for the lookup endpoint. Empty values are left out, so the backend sees what is known. */
export function flightLookupPath(params: {
  flightNo: string
  date?: string
  from?: string
  to?: string
}): string {
  const query = new URLSearchParams({ flightNo: normalizeFlightNo(params.flightNo) })
  if (params.date) query.set("date", params.date)
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  return `/api/flights/lookup?${query.toString()}`
}

export function lookupFlight(params: {
  flightNo: string
  date?: string
  from?: string
  to?: string
}): Promise<FlightLookup[]> {
  return api.get<FlightLookup[]>(flightLookupPath(params))
}

/** What the form takes from a found route. */
export interface FlightLookupFill {
  from: Airport
  to: Airport
  /** The airline name to show, or null if the lookup did not name one. */
  airline: string | null
  /** The aircraft in the spelling of the form's list, or as the provider named it. */
  aircraft: string
}

/**
 * Turns a lookup result into the values the form shows. The aircraft is written the way
 * the site writes it ("B77W" or "Boeing 777-300ER" both become "Boeing 777-300ER"), so a
 * later save does not record the same type in a second spelling. Types the site does not
 * know are kept as they were reported.
 */
export function fillFromLookup(route: FlightLookup, language: string): FlightLookupFill {
  const model = route.aircraftModel?.trim() || route.aircraftIcao?.trim() || ""
  const type = aircraftTypeOf(model)

  return {
    from: route.from,
    to: route.to,
    airline: route.airline ? airlineName(route.airline, language) : null,
    aircraft: type ? AIRCRAFT_TYPES[type].name : model,
  }
}
