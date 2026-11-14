import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { useSession } from "@/features/auth/api"
import { Timeline } from "@/features/flights/Timeline"
import { statsQuery } from "@/features/stats/api"
import { useFormatters } from "@/lib/format"

export function HomePage() {
  const { t } = useTranslation()
  const format = useFormatters()
  const { isAdmin } = useSession()
  // The same request the statistics page makes, so opening that page afterwards is instant.
  const { data: stats } = useQuery(statsQuery)

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.title")}</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">{t("home.subtitle")}</p>
          {/* The whole log in one line, linking to the page that breaks it down. */}
          {stats && stats.flights > 0 && (
            <p className="mt-3 text-sm">
              <Link to="/stats" className="underline-offset-2 hover:underline">
                {[
                  t("flights.count", { count: stats.flights }),
                  t("flights.distance", { distance: format.number(stats.totalDistanceKm) }),
                  t("home.airportCount", { count: stats.airports }),
                  t("home.countryCount", { count: stats.countries }),
                ].join(" · ")}
              </Link>
            </p>
          )}
        </div>
        {isAdmin && (
          <Link to="/flights/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            {t("flights.add")}
          </Link>
        )}
      </section>

      <Timeline />
    </div>
  )
}
