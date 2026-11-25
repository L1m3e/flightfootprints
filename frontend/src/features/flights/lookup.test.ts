import { describe, expect, it } from "vitest"

import type { Airport, FlightLookup } from "@/features/flights/api"
import { fillFromLookup, flightLookupPath } from "@/features/flights/lookup"

const PVG: Airport = {
  iata: "PVG",
  name: "Shanghai Pudong International Airport",
  city: "Shanghai",
  cityZh: "上海",
  country: "CN",
  lat: 31.1443,
  lon: 121.8083,
}
const JFK: Airport = {
  iata: "JFK",
  name: "John F. Kennedy International Airport",
  city: "New York",
  cityZh: "纽约",
  country: "US",
  lat: 40.6413,
  lon: -73.7781,
}

function route(overrides: Partial<FlightLookup> = {}): FlightLookup {
  return {
    flightNo: "MU587",
    from: PVG,
    to: JFK,
    aircraftIcao: "B77W",
    aircraftModel: "Boeing 777-300ER",
    airline: { iata: "MU", name: "China Eastern Airlines", nameZh: "中国东方航空" },
    ...overrides,
  }
}

describe("flightLookupPath", () => {
  it("asks for a number, a date and the airports already chosen", () => {
    expect(flightLookupPath({ flightNo: "MU587", date: "2026-11-20", from: "PVG", to: "JFK" })).toBe(
      "/api/flights/lookup?flightNo=MU587&date=2026-11-20&from=PVG&to=JFK",
    )
  })

  it("normalises the number the way the backend does", () => {
    expect(flightLookupPath({ flightNo: " mu 587 " })).toBe("/api/flights/lookup?flightNo=MU587")
  })

  it("leaves out values that are not known yet", () => {
    expect(flightLookupPath({ flightNo: "CA818", date: "" })).toBe("/api/flights/lookup?flightNo=CA818")
  })
})

describe("fillFromLookup", () => {
  it("takes the airports and the airline name of the page's language", () => {
    expect(fillFromLookup(route(), "zh")).toEqual({
      from: PVG,
      to: JFK,
      airline: "中国东方航空",
      aircraft: "Boeing 777-300ER",
    })
  })

  it("writes the aircraft the way the site writes it", () => {
    expect(fillFromLookup(route({ aircraftModel: null, aircraftIcao: "B77W" }), "en").aircraft).toBe(
      "Boeing 777-300ER",
    )
    expect(fillFromLookup(route({ aircraftModel: "777-300ER", aircraftIcao: null }), "en").aircraft).toBe(
      "Boeing 777-300ER",
    )
  })

  it("keeps an aircraft type the site does not know", () => {
    expect(fillFromLookup(route({ aircraftModel: "Embraer E190", aircraftIcao: "E190" }), "en").aircraft).toBe(
      "Embraer E190",
    )
  })

  it("has nothing for a provider that only knows the route", () => {
    expect(fillFromLookup(route({ aircraftModel: null, aircraftIcao: null, airline: null }), "en")).toMatchObject({
      aircraft: "",
      airline: null,
    })
  })
})
