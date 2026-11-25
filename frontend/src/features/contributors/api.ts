import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { sessionQuery } from "@/features/auth/api"
import { api, ApiError } from "@/lib/api"

/** Somebody who helped build the site, as the API returns them. */
export interface Contributor {
  id: number
  name: string
  /** A web address the name leads to, such as a GitHub profile. */
  link: string | null
  /** What the person did, in a sentence. */
  note: string | null
}

/** What the API accepts when adding or changing a contributor. */
export type ContributorInput = Omit<Contributor, "id">

export const contributorsQuery = queryOptions({
  queryKey: ["contributors"],
  queryFn: () => api.get<Contributor[]>("/api/contributors"),
})

/** After any change the list is fetched again. A 401 also means the session is gone. */
function useContributorMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contributorsQuery.queryKey }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey })
      }
    },
  })
}

export function useAddContributor() {
  return useContributorMutation((input: ContributorInput) => api.post<Contributor>("/api/contributors", input))
}

export function useUpdateContributor(id: number) {
  return useContributorMutation((input: ContributorInput) => api.put<Contributor>(`/api/contributors/${id}`, input))
}

export function useDeleteContributor() {
  return useContributorMutation((id: number) => api.delete(`/api/contributors/${id}`))
}
