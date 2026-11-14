import { useQuery } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { flightsQuery } from "@/features/flights/api"
import { FlightDetails } from "@/features/map/FlightDetails"
import { FlightMap, type FlightMapHandle } from "@/features/map/FlightMap"
import { FlightMapList } from "@/features/map/FlightMapList"

export function MapPage() {
  const { t } = useTranslation()
  const { data: flights, isPending, isError, refetch } = useQuery(flightsQuery)
  const mapRef = useRef<FlightMapHandle>(null)
  const [basemapUnavailable, setBasemapUnavailable] = useState(false)

  // The selected flight lives in the address (/map?flight=12): it survives a reload,
  // and other pages can link straight to a flight on the map.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedFlightId = Number(searchParams.get("flight")) || null
  const selectedFlight = flights?.find((flight) => flight.id === selectedFlightId) ?? null

  function select(flightId: number | null) {
    // "replace": choosing flights should not fill the browser history with entries.
    setSearchParams(flightId === null ? {} : { flight: String(flightId) }, { replace: true })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("map.title")}</h1>

      {/* <output> is announced by screen readers when it appears, like role="status". */}
      {basemapUnavailable && (
        <output className="block rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t("map.basemapUnavailable")}
        </output>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative">
          {/* The map fills its parent, so the parent decides the size. */}
          <div className="h-[60svh] min-h-80 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 lg:h-[70svh]">
            {isPending ? (
              <Skeleton className="size-full rounded-none" />
            ) : isError ? (
              <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">{t("errors.loadFailed")}</p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  {t("errors.retry")}
                </Button>
              </div>
            ) : (
              <FlightMap
                ref={mapRef}
                flights={flights}
                selectedFlightId={selectedFlight?.id ?? null}
                onSelect={select}
                onBasemapUnavailable={() => setBasemapUnavailable(true)}
              />
            )}
          </div>

          {/* On its own background: plain text over the map's place names is unreadable. */}
          {flights?.length === 0 && (
            <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-card/95 px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground shadow-sm ring-1 ring-foreground/10">
              {t("map.empty")}
            </p>
          )}

        </div>

        {/* Beside the map on a wide screen, below it otherwise. The details sit here and
            not on top of the map, where they would cover the very route they describe.
            On a wide screen the column is as tall as the map and the list scrolls inside it. */}
        {flights && flights.length > 0 && (
          <aside className="flex flex-col gap-4 lg:h-[70svh]">
            {selectedFlight ? (
              <FlightDetails flight={selectedFlight} onClose={() => select(null)} className="shrink-0" />
            ) : (
              <p className="text-sm text-muted-foreground">{t("map.selectHint")}</p>
            )}
            <FlightMapList
              flights={flights}
              selectedFlightId={selectedFlight?.id ?? null}
              onSelect={(flightId) => {
                select(flightId)
                // Chosen from the list, the route may be off screen: bring it into view.
                mapRef.current?.showFlight(flightId)
              }}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
