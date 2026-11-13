import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/app/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { MapPage } from "@/pages/MapPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { StatsPage } from "@/pages/StatsPage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "map", Component: MapPage },
      { path: "stats", Component: StatsPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
])
