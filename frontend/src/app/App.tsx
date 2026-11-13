import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider } from "react-router"

import { router } from "@/app/router"
import { Toaster } from "@/components/ui/sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Flight data changes rarely, so a cached answer stays "fresh" for 30 seconds
      // and moving between pages does not refetch everything.
      staleTime: 30_000,
      // One retry smooths over a blip without making a real outage wait for long.
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      {/* Only rendered in development; production builds drop it. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
