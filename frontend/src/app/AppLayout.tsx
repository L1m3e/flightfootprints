import { cn } from "cn"
import { Outlet, useLocation, useNavigation } from "react-router"

import { SiteFooter } from "@/components/SiteFooter"
import { SiteHeader } from "@/components/SiteHeader"

/** Frame shared by every page: header, the routed page, footer. */
export function AppLayout() {
  // Text pages read best in a narrow column. The map wants all the room it can get.
  const wide = useLocation().pathname === "/map"

  // "loading" while the code of the next page is being downloaded after a click on a
  // link. The current page stays on screen during that time, so a thin bar at the top
  // shows that the click was noticed.
  const navigating = useNavigation().state === "loading"

  return (
    <div className="flex min-h-svh flex-col">
      {/* The bar is for the eye only; screen readers get the same fact from aria-busy on <main>. */}
      {navigating && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand" />
      )}
      <SiteHeader wide={wide} />
      <main
        aria-busy={navigating}
        className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10", wide ? "max-w-7xl" : "max-w-5xl")}
      >
        <Outlet />
      </main>
      <SiteFooter wide={wide} />
    </div>
  )
}
