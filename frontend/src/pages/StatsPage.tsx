import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAirlineName } from "@/features/flights/useAirlineName"
import { usePlaceNames } from "@/features/flights/usePlaceNames"
import { statsQuery } from "@/features/stats/api"
import { ExtremeFlight } from "@/features/stats/ExtremeFlight"
import { FlightsOverTimeChart } from "@/features/stats/FlightsOverTimeChart"
import { RankedBars } from "@/features/stats/RankedBars"
import { StatTile } from "@/features/stats/StatTile"
import { kmToMiles, timesAroundEarth } from "@/features/stats/units"
import { useFormatters } from "@/lib/format"

export function StatsPage() {
  const { t } = useTranslation()
  const format = useFormatters()
  const airlineName = useAirlineName()
  const places = usePlaceNames()
  const { data: stats, isPending, isError, refetch } = useQuery(statsQuery)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("stats.title")}</h1>

      {isPending ? (
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-5" aria-busy="true">
          <Skeleton className="col-span-3 h-36 rounded-xl lg:col-span-2" />
          {[0, 1, 2].map((tile) => (
            <Skeleton key={tile} className="h-28 rounded-xl lg:h-36" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("errors.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t("errors.retry")}
          </Button>
        </div>
      ) : stats.flights === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {t("stats.empty")}
        </p>
      ) : (
        <>
          {/* Four headline numbers: tiles, not a chart. The total distance leads. On a narrow
              screen it takes a row of its own and the three counts share the next one;
              on a wide screen all four sit in one row. */}
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
            <StatTile
              lead
              className="col-span-3 lg:col-span-2"
              label={t("stats.distance")}
              value={format.number(stats.totalDistanceKm)}
              unit={t("stats.km")}
            >
              <p>{t("stats.miles", { value: format.number(kmToMiles(stats.totalDistanceKm)) })}</p>
              <p>{t("stats.aroundEarth", { value: format.oneDecimal(timesAroundEarth(stats.totalDistanceKm)) })}</p>
            </StatTile>
            <StatTile label={t("stats.flights")} value={format.number(stats.flights)} />
            <StatTile label={t("stats.airports")} value={format.number(stats.airports)} />
            <StatTile label={t("stats.countries")} value={format.number(stats.countries)} />
          </div>

          <FlightsOverTimeChart years={stats.flightsPerYear} months={stats.flightsPerMonth} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{t("stats.airlinesTitle")}</h2>
                </CardTitle>
                <CardDescription>{t("stats.airlinesHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars
                  rows={stats.airlines.map((entry) => ({
                    // Two airlines never share a code, and those without one differ by name.
                    key: entry.airline.iata ?? `name:${entry.airline.name.toLowerCase()}`,
                    label: airlineName(entry.airline),
                    value: entry.flights,
                    figure: `${t("flights.count", { count: entry.flights })} · ${t("flights.distance", {
                      distance: format.number(entry.distanceKm),
                    })}`,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{t("stats.airportsTitle")}</h2>
                </CardTitle>
                <CardDescription>{t("stats.airportsHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars
                  rows={stats.topAirports.map(({ airport, flights }) => ({
                    key: airport.iata,
                    label: (
                      <>
                        <span className="font-mono">{airport.iata}</span>
                        <span className="ml-2 font-normal text-muted-foreground">
                          {places.place(airport, airport.name)}
                        </span>
                      </>
                    ),
                    value: flights,
                    figure: t("stats.visitCount", { count: flights }),
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          {stats.longestFlight && stats.shortestFlight && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ExtremeFlight title={t("stats.longest")} flight={stats.longestFlight} />
              <ExtremeFlight title={t("stats.shortest")} flight={stats.shortestFlight} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
