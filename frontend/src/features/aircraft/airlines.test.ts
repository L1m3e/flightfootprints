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

  it("has no designator that two airlines share", () => {
    // The lookup keeps one airline per designator, so a shared one would silently hide an airline.
    const designators = AIRLINES.flatMap((airline) => [airline.iata, airline.icao])
    const repeated = designators.filter((code, index) => designators.indexOf(code) !== index)
    expect(repeated).toEqual([])
  })

  it.each([
    // Names that differ by a word or two.
    ["Air China", "CA"],
    ["China Airlines", "CI"],
    ["春秋航空", "9C"],
    ["春秋航空日本", "IJ"],
    ["Jetstar", "JQ"],
    ["Jetstar Japan", "GK"],
    ["联合航空", "UA"],
    ["中国联合航空", "KN"],
    ["国泰航空", "CX"],
    ["国泰港龙航空", "KA"],
    ["Virgin Atlantic", "VS"],
    ["Virgin Australia", "VA"],
    ["Hong Kong Airlines", "HX"],
    ["Hong Kong Express", "UO"],
  ])("tells %j apart: %s", (name, expected) => {
    expect(airlineOf(null, name)?.iata).toBe(expected)
  })

  it.each([
    // Designators that start with a digit, or end with one.
    ["9C8887", "9C"],
    ["3U8888", "3U"],
    ["7C2201", "7C"],
    ["8L9801", "8L"],
    ["B6915", "B6"],
    ["G54501", "G5"],
    ["U28435", "U2"],
  ])("finds the airline of %s", (flightNo, expected) => {
    expect(airlineOf(flightNo, null)?.iata).toBe(expected)
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
