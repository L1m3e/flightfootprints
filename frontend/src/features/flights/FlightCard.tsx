import { cn } from "cn"
import { Pencil, Plane } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import type { Airport, Flight } from "@/features/flights/api"
import { DeleteFlightButton } from "@/features/flights/DeleteFlightButton"
import { useAirlineName } from "@/features/flights/useAirlineName"
import { ViewOnMapLink } from "@/features/flights/ViewOnMapLink"
import { useFormatters } from "@/lib/format"

/**
 * One flight on the timeline. The year is not shown: the timeline groups cards under
 * a year heading.
 */
export function FlightCard({ flight, canEdit }: { flight: Flight; canEdit: boolean }) {
  const { t } = useTranslation()
  const format = useFormatters()
  const airlineName = useAirlineName()

  const details = [flight.aircraft, flight.cabin && t(`flights.cabins.${flight.cabin}`), flight.seat].filter(Boolean)

  return (
    <article className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="p-4 sm:p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <time dateTime={flight.flightDate} className="font-medium">
            {format.monthDay(flight.flightDate)}
          </time>
          <p className="text-muted-foreground">
            {flight.flightNo && <span className="font-mono">{flight.flightNo} · </span>}
            {airlineName(flight.airline)}
          </p>
        </header>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
          <RouteEnd airport={flight.from} />
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-px w-5 bg-border sm:w-14" />
              {/* The icon points to the upper right by default; turned to point along the route. */}
              <Plane className="size-4 rotate-45" />
              <span className="h-px w-5 bg-border sm:w-14" />
            </div>
            <p className="text-xs tabular-nums">
              {t("flights.distance", { distance: format.number(flight.distanceKm) })}
            </p>
          </div>
          <RouteEnd airport={flight.to} alignEnd />
        </div>

        {(details.length > 0 || flight.notes) && (
          <div className="mt-4 space-y-1 text-sm">
            {details.length > 0 && <p className="text-muted-foreground">{details.join(" · ")}</p>}
            {flight.notes && <p className="whitespace-pre-line">{flight.notes}</p>}
          </div>
        )}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-3 text-muted-foreground">
          <ViewOnMapLink flightId={flight.id} />
          {canEdit && (
            <div className="ml-auto flex shrink-0 items-center gap-1 text-foreground">
              <Link to={`/flights/${flight.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <Pencil aria-hidden="true" />
                {t("flights.edit")}
              </Link>
              <DeleteFlightButton flight={flight} />
            </div>
          )}
        </footer>
      </div>
    </article>
  )
}

function RouteEnd({ airport, alignEnd = false }: { airport: Airport; alignEnd?: boolean }) {
  const format = useFormatters()
  const place = [airport.city ?? airport.name, format.country(airport.country)].join(", ")

  return (
    <div className={cn("min-w-0", alignEnd && "text-right")}>
      <p className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{airport.iata}</p>
      {/* The full airport name is long, so it is a tooltip; the card shows city and country.
          On a narrow screen the text wraps instead of being cut off. */}
      <p className="text-sm text-balance text-muted-foreground" title={airport.name}>
        {place}
      </p>
    </div>
  )
}
