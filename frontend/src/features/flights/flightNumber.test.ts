import { describe, expect, it } from "vitest"

import { FLIGHT_NO_PATTERN, normalizeFlightNo } from "@/features/flights/flightNumber"

describe("normalizeFlightNo", () => {
  it("forgives spaces and lower case", () => {
    expect(normalizeFlightNo(" mu 587 ")).toBe("MU587")
    expect(normalizeFlightNo("ca818")).toBe("CA818")
  })
})

describe("FLIGHT_NO_PATTERN", () => {
  it.each(["MU587", "CA818", "9C8887", "CCA818", "AA1"])("accepts %s", (flightNo) => {
    expect(FLIGHT_NO_PATTERN.test(flightNo)).toBe(true)
  })

  it.each(["MU", "M", "MU-587", "MU 587"])("rejects %s", (flightNo) => {
    expect(FLIGHT_NO_PATTERN.test(flightNo)).toBe(false)
  })
})
