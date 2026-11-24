import { cn } from "cn"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthCount, YearCount } from "@/features/stats/api"
import {
  defaultGrouping,
  monthPeriods,
  yearPeriods,
  yearsShownByMonth,
  type Grouping,
  type Period,
} from "@/features/stats/periods"
import { useFormatters } from "@/lib/format"

const AXIS_TEXT = { fill: "var(--muted-foreground)", fontSize: 12 }

const GROUPINGS: Grouping[] = ["year", "month"]

/**
 * Flights per year or per month as columns, with the same numbers available as a table.
 *
 * By year is the overview; by month shows the most recent one or two years in detail.
 * With flights in a single year the chart starts by month, because by year it would be
 * one column in an empty box.
 *
 * One series, so one colour and no legend: the title already says what the columns are.
 */
export function FlightsOverTimeChart({ years, months }: { years: YearCount[]; months: MonthCount[] }) {
  const { t, i18n } = useTranslation()
  const format = useFormatters()
  const language = i18n.resolvedLanguage ?? "en"
  const [grouping, setGrouping] = useState<Grouping>(() => defaultGrouping(years))
  const [view, setView] = useState<"chart" | "table">("chart")

  const periods = useMemo(
    () => (grouping === "year" ? yearPeriods(years) : monthPeriods(months, language)),
    [grouping, years, months, language],
  )

  let hint = t("stats.perYearHint")
  if (grouping === "month") {
    const [from, to] = yearsShownByMonth(months)
    hint = to === undefined ? t("stats.perMonthHintOne", { year: from }) : t("stats.perMonthHintTwo", { from, to })
  }

  return (
    <Card>
      <CardHeader>
        {/* On a phone, title, hint and controls each take a full row (see below). */}
        <CardTitle className="max-sm:col-span-2">
          <h2>{t(grouping === "year" ? "stats.perYearTitle" : "stats.perMonthTitle")}</h2>
        </CardTitle>
        <CardDescription className="max-sm:col-span-2">{hint}</CardDescription>
        {/* Beside the title on a wide screen. On a phone the two controls would squeeze the
            title into a narrow column, so there they get a row of their own under it. */}
        <CardAction className="flex flex-wrap items-center gap-2 max-sm:col-span-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:mt-2 max-sm:justify-self-start sm:justify-end">
          <fieldset className="inline-flex rounded-lg border bg-card p-0.5">
            <legend className="sr-only">{t("stats.groupBy")}</legend>
            {GROUPINGS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={grouping === option}
                onClick={() => setGrouping(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  grouping === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(option === "year" ? "stats.byYear" : "stats.byMonth")}
              </button>
            ))}
          </fieldset>
          {/* The table holds every number of the chart. It is the way to read them
              without hovering, and for anyone who cannot use the chart. */}
          <Button variant="outline" size="sm" onClick={() => setView(view === "chart" ? "table" : "chart")}>
            {t(view === "chart" ? "stats.showTable" : "stats.showChart")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {view === "chart" ? (
          // The fixed height includes the band of labels under the columns.
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periods} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                {/* Horizontal hairlines only, solid and quiet: the columns are the content. */}
                <CartesianGrid vertical={false} stroke="var(--border)" />
                {/* Where the labels do not all fit (two years of months on a phone), the
                    chart leaves some out by itself instead of printing them over each other. */}
                <XAxis
                  dataKey="label"
                  tick={AXIS_TEXT}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={4}
                />
                {/* Whole numbers only: there is no such thing as half a flight. */}
                <YAxis allowDecimals={false} tick={AXIS_TEXT} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  content={PeriodTooltip}
                  // Hovering anywhere in a column's band counts, not only on the bar.
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
            <caption className="sr-only">
              {t(grouping === "year" ? "stats.perYearTitle" : "stats.perMonthTitle")}
            </caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  {t(grouping === "year" ? "stats.yearColumn" : "stats.monthColumn")}
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
              {periods.map((period) => (
                <tr key={period.key} className="border-b last:border-0">
                  <th scope="row" className="py-2 text-left font-normal">
                    {period.name}
                  </th>
                  <td className="py-2 text-right">{format.number(period.flights)}</td>
                  <td className="py-2 text-right">{format.number(period.distanceKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

/** The value leads, the period follows: whoever hovers already knows which column they are on. */
function PeriodTooltip({ active, payload }: TooltipContentProps) {
  const { t } = useTranslation()
  const format = useFormatters()
  if (!active || !payload?.length) return null

  const period = payload[0].payload as Period
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <p className="font-semibold">{t("flights.count", { count: period.flights })}</p>
      <p className="text-muted-foreground">
        {period.name} · {t("flights.distance", { distance: format.number(period.distanceKm) })}
      </p>
    </div>
  )
}
