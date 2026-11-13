import { cn } from "cn"
import { ChartColumn, Earth, GalleryVerticalEnd } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { LanguageToggle } from "@/components/LanguageToggle"
import { Logo } from "@/components/Logo"
import { UserMenu } from "@/features/auth/UserMenu"

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.timeline", icon: GalleryVerticalEnd },
  { to: "/map", labelKey: "nav.map", icon: Earth },
  { to: "/stats", labelKey: "nav.stats", icon: ChartColumn },
] as const

export function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      {/* On a phone the navigation wraps onto a second row; from "sm" up it is one row. */}
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:gap-x-5 sm:px-6 sm:py-0">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight">
          <Logo className="size-7" />
          {/* On a phone only the mark is shown; the name stays available to screen readers. */}
          <span className="sr-only sm:not-sr-only">Flight Footprints</span>
        </Link>

        <nav aria-label={t("nav.label")} className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto">
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              // `end` stops "/" from also matching "/map" and "/stats".
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
