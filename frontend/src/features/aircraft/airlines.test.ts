import { describe, expect, it } from "vitest"

import { AIRLINES, airlineDesignator, airlineOf } from "@/features/aircraft/airlines"

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
  ])("takes the airline part of %j", (flightNo, expected) => {
    expect(airlineDesignator(flightNo)).toBe(expected)
  })

  it.each([null, undefined, "", " ", "C"])("has nothing to take from %j", (flightNo) => {
    expect(airlineDesignator(flightNo)).toBeNull()
  })
})

describe("airlineOf", () => {
  it("finds every airline by both of its designators and by all of its names", () => {
    for (const airline of AIRLINES) {
      expect(airlineOf(`${airline.iata}123`, null), airline.iata).toBe(airline)
      expect(airlineOf(`${airline.icao}123`, null), airline.icao).toBe(airline)
      for (const name of [airline.name, ...airline.aliases]) {
        expect(airlineOf(null, name), name).toBe(airline)
      }
    }
  })

  it("lets the flight number decide when the name says something else", () => {
    // A ticket sold by one airline for a flight under another airline's number.
    expect(airlineOf("CA818", "United Airlines")?.iata).toBe("CA")
  })

  it("falls back to the name when the flight number is missing or unknown", () => {
    expect(airlineOf(null, "Air China")?.iata).toBe("CA")
    expect(airlineOf("", "中国东方航空公司")?.iata).toBe("MU")
    expect(airlineOf("ZZ100", "Singapore Airlines")?.iata).toBe("SQ")
  })

  it.each([
    ["delta", "DL"],
    ["Delta Airlines", "DL"],
    ["DELTA AIR LINES", "DL"],
    ["china eastern", "MU"],
    ["Cathay Pacific Airways", "CX"],
    ["国航", "CA"],
    ["全日空", "NH"],
  ])("reads the name %j as %s", (name, expected) => {
    expect(airlineOf(null, name)?.iata).toBe(expected)
  })

  it.each([
    ["LA800", "LATAM"],
    [null, "Some Unknown Air"],
    [null, null],
    [null, ""],
    // "Air" alone must not match an airline whose name merely starts with it.
    [null, "Air"],
  ])("knows no airline for %j / %j", (flightNo, name) => {
    expect(airlineOf(flightNo, name)).toBeNull()
  })
})
