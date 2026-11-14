import { describe, expect, it } from "vitest"

import type { Airport, Flight } from "@/features/flights/api"
import { groupByYear } from "@/features/flights/groupByYear"

const PVG: Airport = { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "CN", lat: 31.14, lon: 121.8 }
const NRT: Airport = { iata: "NRT", name: "Narita", city: "Narita", country: "JP", lat: 35.77, lon: 140.39 }

let nextId = 1
function flight(flightDate: string, distanceKm: number): Flight {
  return {
    id: nextId++,
    flightDate,
    flightNo: null,
    airline: "Test Air",
    from: PVG,
    to: NRT,
    aircraft: null,
    seat: null,
    cabin: null,
    distanceKm,
    notes: null,
  }
}

describe("groupByYear", () => {
  it("has no groups without flights", () => {
    expect(groupByYear([])).toEqual([])
  })

  it("makes one group per year, newest year first, and adds up the distance", () => {
    // Newest first, the order the API returns.
    const flights = [
      flight("2024-02-14", 1000),
      flight("2022-03-18", 3800),
      flight("2022-03-03", 10900),
      flight("2019-07-04", 8750),
    ]

    const groups = groupByYear(flights)

    expect(groups.map((group) => group.year)).toEqual([2024, 2022, 2019])
    expect(groups.map((group) => group.flights.length)).toEqual([1, 2, 1])
    expect(groups.map((group) => group.distanceKm)).toEqual([1000, 14700, 8750])
  })

  it("keeps the flights of a year in the order they came in", () => {
    const march18 = flight("2022-03-18", 1)
    const march3 = flight("2022-03-03", 1)

    const [group] = groupByYear([march18, march3])

    expect(group.flights).toEqual([march18, march3])
  })

  it("puts a flight on New Year's Day in its own year, whatever the time zone", () => {
    const groups = groupByYear([flight("2024-01-01", 500), flight("2023-12-31", 700)])

    expect(groups.map((group) => group.year)).toEqual([2024, 2023])
  })

  it("orders the years even when the flights are not sorted", () => {
    const groups = groupByYear([flight("2019-05-01", 1), flight("2024-05-01", 1), flight("2021-05-01", 1)])

    expect(groups.map((group) => group.year)).toEqual([2024, 2021, 2019])
  })
})
