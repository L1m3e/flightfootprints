import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { sessionQuery } from "@/features/auth/api"
import { api, ApiError } from "@/lib/api"

export const CABINS = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"] as const
export type Cabin = (typeof CABINS)[number]

export interface Airport {
  iata: string
  name: string
  city: string | null
  /** ISO 3166-1 alpha-2 code, e.g. "CN". */
  country: string
  lat: number
  lon: number
}

/** A flight as the API returns it, with both airports included. */
export interface Flight {
  id: number
  /** "YYYY-MM-DD" */
  flightDate: string
  flightNo: string | null
  airline: string
  from: Airport
  to: Airport
  aircraft: string | null
  seat: string | null
  cabin: Cabin | null
  /** Great-circle distance, computed by the backend. */
  distanceKm: number
  notes: string | null
}

/** What the API accepts when creating or changing a flight. */
export interface FlightInput {
  flightDate: string
  flightNo: string | null
  airline: string
  fromIata: string
  toIata: string
  aircraft: string | null
  seat: string | null
  cabin: Cabin | null
  notes: string | null
}

export const flightsQuery = queryOptions({
  queryKey: ["flights"],
  queryFn: () => api.get<Flight[]>("/api/flights"),
})

export function flightQuery(id: number) {
  return queryOptions({
    queryKey: ["flights", id],
    queryFn: () => api.get<Flight>(`/api/flights/${id}`),
    // A flight that does not exist will not start existing on a second try.
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  })
}

export function airportSearchQuery(term: string) {
  return queryOptions({
    queryKey: ["airports", "search", term],
    queryFn: () => api.get<Airport[]>(`/api/airports?q=${encodeURIComponent(term)}`),
    enabled: term.length > 0,
    // Airports do not change while the page is open.
    staleTime: Infinity,
    // Keep showing the previous matches while the next ones load, instead of an empty list.
    placeholderData: keepPreviousData,
  })
}

/** After any change, the list is fetched again. A 401 also means the session is gone. */
function useFlightMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flightsQuery.queryKey }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey })
      }
    },
  })
}

export function useCreateFlight() {
  return useFlightMutation((input: FlightInput) => api.post<Flight>("/api/flights", input))
}

export function useUpdateFlight(id: number) {
  return useFlightMutation((input: FlightInput) => api.put<Flight>(`/api/flights/${id}`, input))
}

export function useDeleteFlight() {
  return useFlightMutation((id: number) => api.delete(`/api/flights/${id}`))
}
