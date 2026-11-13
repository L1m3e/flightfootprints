import { cn } from "cn"
import { ChartColumn, Earth, GalleryVerticalEnd } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { LanguageToggle } from "@/components/LanguageToggle"
import { Logo } from "@/components/Logo"

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.timeline", icon: GalleryVerticalEnd },
  { to: "/map", labelKey: "nav.map", icon: Earth },
  { to: "/stats", labelKey: "nav.stats", icon: ChartColumn },
] as const

export function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight">
          <Logo className="size-7" />
          {/* The mark alone has no text, so on small screens the name stays for screen readers. */}
          <span className="sr-only sm:not-sr-only">Flight Footprints</span>
        </Link>

        <nav aria-label={t("nav.label")} className="flex items-center gap-1">
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
              <Icon className="hidden size-4 sm:block" aria-hidden="true" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}
