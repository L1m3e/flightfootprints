import { cn } from "cn"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import type { Flight } from "@/features/flights/api"
import { useFormatters } from "@/lib/format"

/**
 * The flights next to the map, one button each. It does the same as clicking an arc,
 * and it is the way to reach a flight with a keyboard or a screen reader, which cannot
 * operate lines drawn on a canvas.
 */
export function FlightMapList({
  flights,
  selectedFlightId,
  onSelect,
}: {
  flights: Flight[]
  selectedFlightId: number | null
  onSelect: (flightId: number) => void
}) {
  const { t } = useTranslation()
  const format = useFormatters()
  const listRef = useRef<HTMLOListElement>(null)

  // A flight chosen on the map may be out of sight in a long list. Only the list itself is
  // scrolled: scrollIntoView() would also scroll the page, away from the map.
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!list || !row) return
    const top = row.offsetTop
    const bottom = top + row.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [selectedFlightId])

  return (
    // min-h-0 lets this section shrink inside its column, so the list scrolls instead of
    // pushing the column taller than the map.
    <section aria-labelledby="map-flights-heading" className="flex min-h-0 flex-1 flex-col">
      <h2 id="map-flights-heading" className="text-sm font-medium">
        {t("map.flightsHeading")} <span className="font-normal text-muted-foreground">{flights.length}</span>
      </h2>
      {/* "relative" makes the list the reference for each row's offsetTop above. */}
      <ol ref={listRef} className="relative mt-2 min-h-0 flex-1 space-y-1 lg:overflow-y-auto lg:pr-1">
        {flights.map((flight) => {
          const selected = flight.id === selectedFlightId
          return (
            <li key={flight.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(flight.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono font-medium">
                    {flight.from.iata} <span aria-hidden="true">→</span>
                    <span className="sr-only">{t("flights.to")}</span> {flight.to.iata}
                  </span>
                  <time
                    dateTime={flight.flightDate}
                    className={cn("text-xs", selected ? "text-primary-foreground/80" : "text-muted-foreground")}
                  >
                    {format.date(flight.flightDate)}
                  </time>
                </span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    selected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {[flight.flightNo, flight.airline].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
