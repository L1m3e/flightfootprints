import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

/** Response of GET /api/health. */
export interface Health {
  status: string
  airports: number
}

/**
 * Query key and fetcher kept together, so every component that needs the health
 * check shares one cache entry: useQuery(healthQuery).
 */
export const healthQuery = queryOptions({
  queryKey: ["health"],
  queryFn: () => api.get<Health>("/api/health"),
})
