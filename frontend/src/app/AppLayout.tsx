import { Outlet } from "react-router"

import { SiteFooter } from "@/components/SiteFooter"
import { SiteHeader } from "@/components/SiteHeader"

/** Frame shared by every page: header, the routed page, footer. */
export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
