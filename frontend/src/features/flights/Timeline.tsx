import { useQuery } from "@tanstack/react-query"
import { PlaneTakeoff, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/api"
import { flightsQuery } from "@/features/flights/api"
import { FlightCard } from "@/features/flights/FlightCard"
import { groupByYear } from "@/features/flights/groupByYear"
import { useFormatters } from "@/lib/format"

/**
 * Every flight, newest first, grouped under year headings along a vertical line.
 * Edit and delete controls only appear for the administrator.
 */
export function Timeline() {
  const { t } = useTranslation()
  const format = useFormatters()
  const { isAdmin } = useSession()
  const { data: flights, isPending, isError, refetch } = useQuery(flightsQuery)

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("errors.loadFailed")}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {t("errors.retry")}
        </Button>
      </div>
    )
  }

  if (flights.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <PlaneTakeoff className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-medium">{t("home.emptyTitle")}</h2>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">{t("home.emptyBody")}</p>
        {isAdmin && (
          <Link to="/flights/new" className={buttonVariants({ className: "mt-2" })}>
            <Plus aria-hidden="true" />
            {t("flights.addFirst")}
          </Link>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-10">
      {groupByYear(flights).map((group) => (
        <section key={group.year} aria-labelledby={`timeline-${group.year}`}>
          <header className="flex items-baseline gap-3">
            <h2 id={`timeline-${group.year}`} className="text-xl font-semibold tracking-tight">
              {group.year}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("flights.count", { count: group.flights.length })}
              {" · "}
              {t("flights.distance", { distance: format.number(group.distanceKm) })}
            </p>
          </header>

          {/* The list's left border is the line of the timeline. Each flight hangs off it
              with a dot, which is pulled left by exactly the list's padding to sit on the line. */}
          <ol className="relative mt-4 ml-1.5 space-y-4 border-l pl-5 sm:pl-7">
            {group.flights.map((flight) => (
              <li key={flight.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-6 -left-5 size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background sm:-left-7"
                />
                <FlightCard flight={flight} canEdit={isAdmin} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
