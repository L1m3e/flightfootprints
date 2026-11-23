import { cn } from "cn"
import { Pencil, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import { useSession } from "@/features/auth/api"
import type { Airport, Flight } from "@/features/flights/api"
import { useFormatters } from "@/lib/format"

/** Everything known about the flight that is selected on the map. */
export function FlightDetails({
  flight,
  onClose,
  className,
}: {
  flight: Flight
  onClose: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const format = useFormatters()
  const { isAdmin } = useSession()

  const extras = [flight.aircraft, flight.cabin && t(`flights.cabins.${flight.cabin}`), flight.seat].filter(Boolean)

  return (
    // aria-live: a screen reader reads the new details when another flight is chosen.
    <section aria-live="polite" className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <time dateTime={flight.flightDate} className="text-xs text-muted-foreground">
            {format.date(flight.flightDate)}
          </time>
          <h2 className="font-mono text-xl font-semibold tracking-tight">
            {flight.from.iata} <span aria-hidden="true">→</span>
            <span className="sr-only">{t("flights.to")}</span> {flight.to.iata}
          </h2>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t("map.closeDetails")} title={t("map.closeDetails")} onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-1 text-sm font-medium">
        {flight.flightNo && <span className="font-mono">{flight.flightNo} · </span>}
        {flight.airline}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <Place label={t("flights.from")} airport={flight.from} />
        <Place label={t("flights.to")} airport={flight.to} />
      </dl>

      <p className="mt-3 text-sm tabular-nums">{t("flights.distance", { distance: format.number(flight.distanceKm) })}</p>
      {extras.length > 0 && <p className="text-sm text-muted-foreground">{extras.join(" · ")}</p>}
      {flight.notes && <p className="mt-2 text-sm whitespace-pre-line">{flight.notes}</p>}

      {isAdmin && (
        <Link
          to={`/flights/${flight.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
        >
          <Pencil aria-hidden="true" />
          {t("flights.edit")}
        </Link>
      )}
    </section>
  )
}

function Place({ label, airport }: { label: string; airport: Airport }) {
  const format = useFormatters()
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        {airport.name}
        <span className="block text-xs text-muted-foreground">
          {[airport.city, format.country(airport.country)].filter(Boolean).join(", ")}
        </span>
      </dd>
    </div>
  )
}
