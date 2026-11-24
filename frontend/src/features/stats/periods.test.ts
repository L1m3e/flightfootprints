import { describe, expect, it } from "vitest"

import type { MonthCount, YearCount } from "@/features/stats/api"
import { defaultGrouping, monthPeriods, yearPeriods, yearsShownByMonth } from "@/features/stats/periods"

const year = (value: number, flights = 0): YearCount => ({ year: value, flights, distanceKm: flights * 1000 })

/** All twelve months of each year, with flights only where given: { "2026-7": 2 }. */
function monthsOf(years: number[], flights: Record<string, number> = {}): MonthCount[] {
  return years.flatMap((y) =>
    Array.from({ length: 12 }, (_, index) => {
      const count = flights[`${y}-${index + 1}`] ?? 0
      return { year: y, month: index + 1, flights: count, distanceKm: count * 1000 }
    }),
  )
}

describe("defaultGrouping", () => {
  it("starts by month when all flights are in one year", () => {
    expect(defaultGrouping([year(2026, 3)])).toBe("month")
  })

  it("starts by year from two years on", () => {
    expect(defaultGrouping([year(2025, 1), year(2026, 3)])).toBe("year")
    expect(defaultGrouping([year(2019, 2), year(2020), year(2021, 2)])).toBe("year")
  })

  it("has nothing to choose without flights", () => {
    expect(defaultGrouping([])).toBe("month")
  })
})

describe("yearPeriods", () => {
  it("is one period per year, named by the year", () => {
    expect(yearPeriods([year(2025, 1), year(2026, 3)])).toEqual([
      { key: "2025", label: "2025", name: "2025", flights: 1, distanceKm: 1000 },
      { key: "2026", label: "2026", name: "2026", flights: 3, distanceKm: 3000 },
    ])
  })
})

describe("monthPeriods", () => {
  const oneYear = monthsOf([2026], { "2026-7": 1, "2026-9": 2 })

  it("is twelve periods for one year, with the numbers of each month", () => {
    const periods = monthPeriods(oneYear, "en")

    expect(periods).toHaveLength(12)
    expect(periods.map((period) => period.key)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
      "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    ])
    expect(periods.map((period) => period.flights)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0])
    expect(periods[8].distanceKm).toBe(2000)
  })

  it("names the months in English", () => {
    const periods = monthPeriods(oneYear, "en")

    expect(periods.map((period) => period.label)).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ])
    expect(periods[6].name).toBe("July 2026")
  })

  it("names the months in Chinese", () => {
    const periods = monthPeriods(oneYear, "zh")

    expect(periods.map((period) => period.label)).toEqual([
      "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月",
    ])
    expect(periods[6].name).toBe("2026年7月")
  })

  it("puts the year on each January when two years are shown", () => {
    const twoYears = monthsOf([2025, 2026])

    expect(monthPeriods(twoYears, "en").filter((period) => /\d{4}/.test(period.label)).map((p) => p.label)).toEqual([
      "Jan 2025",
      "Jan 2026",
    ])
    expect(monthPeriods(twoYears, "zh")[12].label).toBe("2026年1月")
    expect(monthPeriods(twoYears, "zh")[13].label).toBe("2月")
  })

  it("shows the two most recent years of a longer history", () => {
    const periods = monthPeriods(monthsOf([2019, 2020, 2021], { "2019-3": 2, "2021-12": 1 }), "en")

    expect(periods).toHaveLength(24)
    expect(periods[0].key).toBe("2020-01")
    expect(periods[23]).toMatchObject({ key: "2021-12", flights: 1 })
  })

  it("is empty without flights", () => {
    expect(monthPeriods([], "en")).toEqual([])
  })
})

describe("yearsShownByMonth", () => {
  it("is the one year, or the first and the last of the two that are shown", () => {
    expect(yearsShownByMonth(monthsOf([2026]))).toEqual([2026])
    expect(yearsShownByMonth(monthsOf([2025, 2026]))).toEqual([2025, 2026])
    expect(yearsShownByMonth(monthsOf([2019, 2020, 2021]))).toEqual([2020, 2021])
    expect(yearsShownByMonth([])).toEqual([])
  })
})
