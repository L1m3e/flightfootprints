import { aircraftTypeOf } from "@/features/aircraft/aircraftTypes"
import { airlineOf } from "@/features/aircraft/airlines"
import { LIVERIES, PLAIN_LIVERY, type Livery } from "@/features/aircraft/draw/liveries"
import type { AircraftShape } from "@/features/aircraft/draw/shape"
import { SHAPES } from "@/features/aircraft/draw/shapes"
import type { Flight } from "@/features/flights/api"

/** The three fields of a flight that decide what its aircraft looks like. */
export type FlownAircraft = Pick<Flight, "flightNo" | "airline" | "aircraft">

/**
 * What to draw for a flight: the shape of its aircraft type in the colours of its airline.
 *
 * This is the one place that decides it, for every page that shows an aircraft.
 * - No drawing (null) when the aircraft type is not recognised or has not been drawn
 *   yet. Showing some other aircraft instead would be wrong, which is worse than nothing.
 * - An airline that is not recognised, or has no livery yet, gets the unpainted aircraft.
 */
export function drawingFor(flight: FlownAircraft): { shape: AircraftShape; livery: Livery } | null {
  const type = aircraftTypeOf(flight.aircraft)
  const shape = type && SHAPES[type]
  if (!shape) return null

  const airline = airlineOf(flight.flightNo, flight.airline)
  return { shape, livery: (airline && LIVERIES[airline.iata]) || PLAIN_LIVERY }
}
