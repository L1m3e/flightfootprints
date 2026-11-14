import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { YearCount } from "@/features/stats/api"
import { useFormatters } from "@/lib/format"

const AXIS_TEXT = { fill: "var(--muted-foreground)", fontSize: 12 }

/**
 * Flights per year as columns, with the same numbers available as a table.
 *
 * One series, so one colour and no legend: the title already says what the columns are.
 */
export function FlightsPerYearChart({ years }: { years: YearCount[] }) {
  const { t } = useTranslation()
  const format = useFormatters()
  const [view, setView] = useState<"chart" | "table">("chart")

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("stats.perYearTitle")}</h2>
        </CardTitle>
        <CardDescription>{t("stats.perYearHint")}</CardDescription>
        <CardAction>
          {/* The table holds every number of the chart. It is the way to read them
              without hovering, and for anyone who cannot use the chart. */}
          <Button variant="outline" size="sm" onClick={() => setView(view === "chart" ? "table" : "chart")}>
            {t(view === "chart" ? "stats.showTable" : "stats.showChart")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {view === "chart" ? (
          // The fixed height includes the band of year labels under the columns.
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={years} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                {/* Horizontal hairlines only, solid and quiet: the columns are the content. */}
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" tick={AXIS_TEXT} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                {/* Whole numbers only: there is no such thing as half a flight. */}
                <YAxis allowDecimals={false} tick={AXIS_TEXT} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  content={YearTooltip}
                  // Hovering anywhere in a year's column band counts, not only on the bar.
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar
                  dataKey="flights"
                  name={t("stats.flightsColumn")}
                  fill="var(--chart-1)"
                  // Thin columns with air between them; rounded at the top, square on the baseline.
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fillOpacity: 0.8 }}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{t("stats.perYearTitle")}</caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  {t("stats.yearColumn")}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {t("stats.flightsColumn")}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {t("stats.distanceColumn")}
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {years.map((entry) => (
                <tr key={entry.year} className="border-b last:border-0">
                  <th scope="row" className="py-2 text-left font-normal">
                    {entry.year}
                  </th>
                  <td className="py-2 text-right">{format.number(entry.flights)}</td>
                  <td className="py-2 text-right">{format.number(entry.distanceKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

/** The value leads, the year follows: whoever hovers already knows which column they are on. */
function YearTooltip({ active, payload }: TooltipContentProps) {
  const { t } = useTranslation()
  const format = useFormatters()
  if (!active || !payload?.length) return null

  const entry = payload[0].payload as YearCount
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <p className="font-semibold">{t("flights.count", { count: entry.flights })}</p>
      <p className="text-muted-foreground">
        {entry.year} · {t("flights.distance", { distance: format.number(entry.distanceKm) })}
      </p>
    </div>
  )
}
