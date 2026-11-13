import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export type Role = "ADMIN" | "USER"

/** Response of GET /api/auth/me. It is a 200 for visitors too, with authenticated = false. */
export interface Session {
  authenticated: boolean
  username: string | null
  role: Role | null
  registrationEnabled: boolean
}

export interface Credentials {
  username: string
  password: string
}

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => api.get<Session>("/api/auth/me"),
  // Who is signed in only changes through the mutations below, which refresh it themselves.
  staleTime: 5 * 60_000,
})

/**
 * The current visitor. The UI uses this to decide what to show; the backend checks every
 * request again by itself, so hiding a button is never what protects the data.
 */
export function useSession() {
  const { data, isPending } = useQuery(sessionQuery)
  return {
    session: data,
    isLoading: isPending,
    isAdmin: data?.role === "ADMIN",
  }
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Credentials) => api.postForm<void>("/api/auth/login", { ...credentials }),
    // Returning the promise keeps the mutation pending until the session has been
    // fetched again, so whoever awaits it sees the signed-in state.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }),
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>("/api/auth/logout"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: Credentials) => api.post<{ username: string; role: Role }>("/api/auth/register", credentials),
  })
}
