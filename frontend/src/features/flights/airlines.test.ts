import { describe, expect, it } from "vitest"

import { airlineDesignator, airlineName, airlineOfFlightNo, findAirline } from "@/features/flights/airlines"
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

describe("findAirline", () => {
  it.each([
    ["Air China", AIR_CHINA],
    ["air china", AIR_CHINA],
    ["AirChina", AIR_CHINA],
    ["  air   china ", AIR_CHINA],
    ["中国国际航空", AIR_CHINA],
    ["国航", AIR_CHINA],
    ["CA", AIR_CHINA],
    ["ca", AIR_CHINA],
    ["CCA", AIR_CHINA],
    ["China Airlines", CHINA_AIRLINES],
    ["9C", SPRING],
    ["Air Premia", AIR_PREMIA],
  ])("understands %j", (text, expected) => {
    expect(findAirline(airlines, text)).toBe(expected)
  })

  it.each(["Footprint Air", "Air", "China", "", "   ", null, undefined])("finds no airline in %j", (text) => {
    expect(findAirline(airlines, text)).toBeUndefined()
  })

  it("ignores punctuation in a name", () => {
    const tway: Airline = { iata: "TW", icao: "TWB", name: "T'way Air", nameZh: "德威航空", aliases: [] }

    expect(findAirline([tway], "tway air")).toBe(tway)
    expect(findAirline([tway], "T-way Air")).toBe(tway)
  })

  it("finds neither of two airlines by a name they share", () => {
    const first: Airline = { iata: "AA", icao: "AAA", name: "First Air", nameZh: null, aliases: ["Shared"] }
    const second: Airline = { iata: "BB", icao: "BBB", name: "Second Air", nameZh: null, aliases: ["shared"] }

    expect(findAirline([first, second], "Shared")).toBeUndefined()
    expect(findAirline([first, second], "Second Air")).toBe(second)
  })
})

describe("airlineName for the airline of a flight", () => {
  it("shows a known airline in the language of the page", () => {
    const cathay = { iata: "CX", name: "Cathay Pacific", nameZh: "国泰航空" }

    expect(airlineName(cathay, "en")).toBe("Cathay Pacific")
    expect(airlineName(cathay, "zh")).toBe("国泰航空")
    expect(airlineName(cathay, "zh-CN")).toBe("国泰航空")
  })

  it("shows an airline that is not in the list as it was typed, in every language", () => {
    const typed = { iata: null, name: "Footprint Air", nameZh: null }

    expect(airlineName(typed, "en")).toBe("Footprint Air")
    expect(airlineName(typed, "zh")).toBe("Footprint Air")
  })
})
