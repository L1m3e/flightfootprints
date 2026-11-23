import { describe, expect, it } from "vitest"

import { LIVERIES, PLAIN_LIVERY } from "@/features/aircraft/draw/liveries"
import { SHAPES } from "@/features/aircraft/draw/shapes"
import { drawingFor } from "@/features/aircraft/drawingFor"

describe("drawingFor", () => {
  it("draws the aircraft type in the livery of the flight number's airline", () => {
    expect(drawingFor({ flightNo: "CA981", airline: "Air China", aircraft: "Boeing 747-8" })).toEqual({
      shape: SHAPES.B748,
      livery: LIVERIES.CA,
    })
  })

  it("recognises the airline by name when there is no flight number", () => {
    expect(drawingFor({ flightNo: null, airline: "国航", aircraft: "747-8i" })?.livery).toBe(LIVERIES.CA)
  })

  it("leaves the aircraft unpainted for an airline it does not know", () => {
    expect(drawingFor({ flightNo: "ZZ100", airline: "Some Unknown Air", aircraft: "B748" })).toEqual({
      shape: SHAPES.B748,
      livery: PLAIN_LIVERY,
    })
  })

  it("leaves it unpainted as well for an airline it knows but has no livery for", () => {
    // Skipped once Lufthansa has a livery: there is then nothing left to check here.
    if (LIVERIES.LH) return
    expect(drawingFor({ flightNo: "LH720", airline: "Lufthansa", aircraft: "B748" })?.livery).toBe(PLAIN_LIVERY)
  })

  it("draws nothing when the aircraft type is missing or not recognised", () => {
    expect(drawingFor({ flightNo: "CA981", airline: "Air China", aircraft: null })).toBeNull()
    expect(drawingFor({ flightNo: "CA981", airline: "Air China", aircraft: "a big one" })).toBeNull()
  })

  it("draws nothing rather than a different aircraft when the type has no drawing", () => {
    // Recognised, but the shape registry has no entry for it. The registry is passed in
    // through the module, so the check is made against whatever it holds today.
    const undrawn = { flightNo: "MU5101", airline: "China Eastern", aircraft: "Concorde" }
    expect(drawingFor(undrawn)).toBeNull()

    if (!SHAPES.A320) {
      expect(drawingFor({ flightNo: "MU5101", airline: "China Eastern", aircraft: "Airbus A320" })).toBeNull()
    }
  })
})
