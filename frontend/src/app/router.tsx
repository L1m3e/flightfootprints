import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/app/AppLayout"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { SignInPage } from "@/features/auth/SignInPage"
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
      { path: "login", Component: SignInPage },
      { path: "register", Component: RegisterPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
])
