import { useQuery } from "@tanstack/react-query"
import { PlaneTakeoff, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/api"
import { flightsQuery } from "@/features/flights/api"
import { FlightCard } from "@/features/flights/FlightCard"

/** Every flight, newest first. Edit and delete controls only appear for the administrator. */
export function FlightList() {
  const { t } = useTranslation()
  const { isAdmin } = useSession()
  const { data: flights, isPending, isError, refetch } = useQuery(flightsQuery)

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
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
    <section className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("flights.count", { count: flights.length })}</p>
      <ol className="space-y-3">
        {flights.map((flight) => (
          <li key={flight.id}>
            <FlightCard flight={flight} canEdit={isAdmin} />
          </li>
        ))}
      </ol>
    </section>
  )
}
