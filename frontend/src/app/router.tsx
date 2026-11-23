import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/app/AppLayout"
import { PageLoading } from "@/components/PageLoading"
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"

// Pages behind `lazy` are separate files that the browser downloads on the first visit to
// that page. The map library alone is larger than the rest of the app, and most visits
// start on the timeline, so it should not be part of what every visitor has to load.
// The same goes for the chart library of the statistics page and for the form libraries,
// which only the sign-in and editing pages use.
//
// HydrateFallback is what shows in the page area while such a file is on its way when the
// site is opened directly on that page.
export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: "map",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/pages/MapPage")).MapPage }),
      },
      {
        path: "stats",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/pages/StatsPage")).StatsPage }),
      },
      {
        path: "login",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/features/auth/SignInPage")).SignInPage }),
      },
      {
        path: "register",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/features/auth/RegisterPage")).RegisterPage }),
      },
      // Both flight pages check for the administrator themselves (see RequireAdmin).
      {
        path: "flights/new",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/features/flights/FlightFormPages")).NewFlightPage }),
      },
      {
        path: "flights/:id/edit",
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/features/flights/FlightFormPages")).EditFlightPage }),
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
])
