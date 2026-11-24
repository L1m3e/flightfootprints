import type { MonthCount, YearCount } from "@/features/stats/api"

/** How the flights are added up for the chart. */
export type Grouping = "year" | "month"

/** One column of the chart and one row of its table: a year or a month. */
export interface Period {
  /** Unique within the series: "2026" or "2026-07". */
  key: string
  /** Under the column: "2026", "Jul" or "7月". */
  label: string
  /** In the tooltip and the table: "2026", "July 2026" or "2026年7月". */
  name: string
  flights: number
  distanceKm: number
}

/** The view by month shows this many calendar years at most, the most recent ones. */
export const YEARS_SHOWN_BY_MONTH = 2

/**
 * With flights in a single year, a chart by year is one column in the middle of an empty
 * box. By month it says something, so that is where the chart starts.
 */
export function defaultGrouping(years: readonly YearCount[]): Grouping {
  return years.length < 2 ? "month" : "year"
}

export function yearPeriods(years: readonly YearCount[]): Period[] {
  return years.map((entry) => ({
    key: String(entry.year),
    label: String(entry.year),
    name: String(entry.year),
    flights: entry.flights,
    distanceKm: entry.distanceKm,
  }))
}

/**
 * The months of the most recent years, named in the given language.
 *
 * A column is labelled with the month alone ("Jul", "7月"). When two years are shown,
 * each January also carries its year, so it is clear where one year ends.
 */
export function monthPeriods(months: readonly MonthCount[], language: string): Period[] {
  if (months.length === 0) return []

  const lastYear = months[months.length - 1].year
  const shown = months.filter((entry) => entry.year > lastYear - YEARS_SHOWN_BY_MONTH)
  const severalYears = shown[0].year !== lastYear

  const monthOnly = new Intl.DateTimeFormat(language, { month: "short" })
  const monthWithYear = new Intl.DateTimeFormat(language, { year: "numeric", month: "short" })
  const fullName = new Intl.DateTimeFormat(language, { year: "numeric", month: "long" })

  return shown.map((entry) => {
    // Day 1 at local midnight: the formatters above use the local time zone as well.
    const firstDay = new Date(entry.year, entry.month - 1, 1)
    return {
      key: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
      label: severalYears && entry.month === 1 ? monthWithYear.format(firstDay) : monthOnly.format(firstDay),
      name: fullName.format(firstDay),
      flights: entry.flights,
      distanceKm: entry.distanceKm,
    }
  })
}

/** The calendar years that the view by month covers: one, or the first and the last of two. */
export function yearsShownByMonth(months: readonly MonthCount[]): number[] {
  if (months.length === 0) return []
  const lastYear = months[months.length - 1].year
  const firstYear = Math.max(months[0].year, lastYear - YEARS_SHOWN_BY_MONTH + 1)
  return firstYear === lastYear ? [lastYear] : [firstYear, lastYear]
}
