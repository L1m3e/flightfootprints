import { queryOptions } from "@tanstack/react-query"

import type { Airport, Flight, FlightAirline } from "@/features/flights/api"
import { api } from "@/lib/api"

export interface AirlineCount {
  airline: FlightAirline
  flights: number
  distanceKm: number
}

export interface AirportCount {
  airport: Airport
  /** Take-offs plus landings at this airport. */
  flights: number
}

export interface YearCount {
  year: number
  flights: number
  distanceKm: number
}

/** Response of GET /api/stats. Every figure is computed by the database. */
export interface Stats {
  flights: number
  totalDistanceKm: number
  airports: number
  countries: number
  /** Most flown first. */
  airlines: AirlineCount[]
  /** Most visited first. */
  topAirports: AirportCount[]
  longestFlight: Flight | null
  shortestFlight: Flight | null
  /** One entry per year from the first flight to the last, including years without flights. */
  flightsPerYear: YearCount[]
}

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: () => api.get<Stats>("/api/stats"),
})
