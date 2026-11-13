import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { flightsQuery } from "@/features/flights/api"
import { FlightMap } from "@/features/map/FlightMap"

export function MapPage() {
  const { t } = useTranslation()
  const { data: flights, isPending, isError, refetch } = useQuery(flightsQuery)
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("map.title")}</h1>

      {/* The map fills its parent, so the parent decides the size. */}
      <div className="h-[60svh] min-h-80 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 sm:h-[70svh]">
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
          <FlightMap flights={flights} selectedFlightId={selectedFlightId} onSelect={setSelectedFlightId} />
        )}
      </div>
    </div>
  )
}
