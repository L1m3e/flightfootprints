import { describe, expect, it } from "vitest"

import { airlineDesignator, airlineName, airlineOfFlightNo } from "@/features/flights/airlines"
import type { Airline } from "@/features/flights/api"

const AIR_CHINA: Airline = { iata: "CA", icao: "CCA", name: "Air China", nameZh: "中国国际航空", aliases: ["国航"] }
const CHINA_AIRLINES: Airline = { iata: "CI", icao: "CAL", name: "China Airlines", nameZh: "中华航空", aliases: [] }
const SPRING: Airline = { iata: "9C", icao: "CQH", name: "Spring Airlines", nameZh: "春秋航空", aliases: [] }
const AIR_PREMIA: Airline = { iata: "YP", icao: "APZ", name: "Air Premia", nameZh: null, aliases: [] }
const airlines = [AIR_CHINA, CHINA_AIRLINES, SPRING, AIR_PREMIA]

describe("airlineDesignator", () => {
  it.each([
    ["CA818", "CA"],
    ["mu 587", "MU"],
    // IATA designators may contain a digit.
    ["9C8887", "9C"],
    ["3U8888", "3U"],
    ["AA1", "AA"],
    // Three letters in front: an ICAO designator.
    ["CCA818", "CCA"],
    ["UAL857", "UAL"],
    // Still being typed: two characters are already a designator.
    ["CA", "CA"],
  ])("takes the airline part of %j", (flightNo, expected) => {
    expect(airlineDesignator(flightNo)).toBe(expected)
  })

  it.each([null, undefined, "", " ", "C"])("has nothing to take from %j", (flightNo) => {
    expect(airlineDesignator(flightNo)).toBeNull()
  })
})

describe("airlineOfFlightNo", () => {
  it("finds the airline by its IATA designator", () => {
    expect(airlineOfFlightNo(airlines, "CA818")).toBe(AIR_CHINA)
    expect(airlineOfFlightNo(airlines, "9c 8887")).toBe(SPRING)
  })

  it("finds it by its ICAO designator when the flight number starts with three letters", () => {
    expect(airlineOfFlightNo(airlines, "CCA818")).toBe(AIR_CHINA)
    // "CAL" is China Airlines, even though it starts with Air China's "CA".
    expect(airlineOfFlightNo(airlines, "CAL12")).toBe(CHINA_AIRLINES)
  })

  it("finds nothing for an unknown designator or without a flight number", () => {
    expect(airlineOfFlightNo(airlines, "ZZ100")).toBeUndefined()
    expect(airlineOfFlightNo(airlines, "")).toBeUndefined()
    expect(airlineOfFlightNo(airlines, null)).toBeUndefined()
    expect(airlineOfFlightNo([], "CA818")).toBeUndefined()
  })
})

describe("airlineName", () => {
  it("is in the language of the interface", () => {
    expect(airlineName(AIR_CHINA, "zh")).toBe("中国国际航空")
    expect(airlineName(AIR_CHINA, "zh-CN")).toBe("中国国际航空")
    expect(airlineName(AIR_CHINA, "en")).toBe("Air China")
  })

  it("falls back to English where there is no Chinese name", () => {
    expect(airlineName(AIR_PREMIA, "zh")).toBe("Air Premia")
  })
})
