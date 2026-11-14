import { describe, expect, it } from "vitest"

import { kmToMiles, timesAroundEarth } from "@/features/stats/units"

describe("kmToMiles", () => {
  it("converts kilometres to statute miles", () => {
    // A marathon is 42.195 km, or 26.2 miles.
    expect(kmToMiles(42.195)).toBeCloseTo(26.2, 1)
    // Shanghai to New York: 11,874 km is about 7,378 miles.
    expect(Math.round(kmToMiles(11_874))).toBe(7378)
    expect(kmToMiles(0)).toBe(0)
  })
})

describe("timesAroundEarth", () => {
  it("counts trips around the equator", () => {
    expect(timesAroundEarth(40_075)).toBe(1)
    expect(timesAroundEarth(100_187.5)).toBeCloseTo(2.5, 6)
    expect(timesAroundEarth(0)).toBe(0)
  })
})
