import { useTranslation } from "react-i18next"

import type { Flight } from "@/features/flights/api"
import { ViewOnMapLink } from "@/features/flights/ViewOnMapLink"
import { kmToMiles } from "@/features/stats/units"
import { useFormatters } from "@/lib/format"

/** The longest or the shortest flight, with a link to its route on the map. */
export function ExtremeFlight({ title, flight }: { title: string; flight: Flight }) {
  const { t } = useTranslation()
  const format = useFormatters()

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {format.number(flight.distanceKm)}
        <span className="ml-1.5 text-base font-normal text-muted-foreground">{t("stats.km")}</span>
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {t("stats.miles", { value: format.number(kmToMiles(flight.distanceKm)) })}
      </p>

      <p className="mt-3 font-mono text-lg font-semibold tracking-tight">
        {flight.from.iata} <span aria-hidden="true">→</span>
        <span className="sr-only">{t("flights.to")}</span> {flight.to.iata}
      </p>
      <p className="text-sm text-muted-foreground">
        {[flight.from.city ?? flight.from.name, flight.to.city ?? flight.to.name].join(" → ")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        <time dateTime={flight.flightDate}>{format.date(flight.flightDate)}</time>
        {" · "}
        {[flight.flightNo, flight.airline].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-3">
        <ViewOnMapLink flightId={flight.id} />
      </div>
    </div>
  )
}
