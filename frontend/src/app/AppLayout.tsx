import { cn } from "cn"
import { Outlet, useLocation } from "react-router"

import { SiteFooter } from "@/components/SiteFooter"
import { SiteHeader } from "@/components/SiteHeader"

/** Frame shared by every page: header, the routed page, footer. */
export function AppLayout() {
  // Text pages read best in a narrow column. The map wants all the room it can get.
  const wide = useLocation().pathname === "/map"

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader wide={wide} />
      <main className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10", wide ? "max-w-7xl" : "max-w-5xl")}>
        <Outlet />
      </main>
      <SiteFooter wide={wide} />
    </div>
  )
}
