import { describe, expect, it } from "vitest"

import { AIRCRAFT_TYPES, aircraftTypeOf, type AircraftTypeId } from "@/features/aircraft/aircraftTypes"

describe("aircraftTypeOf", () => {
  it("recognises every type by its own code and by its own name", () => {
    for (const [id, type] of Object.entries(AIRCRAFT_TYPES)) {
      expect(aircraftTypeOf(id), id).toBe(id)
      expect(aircraftTypeOf(type.name), type.name).toBe(id)
    }
  })

  it.each<[string, AircraftTypeId]>([
    // The same aircraft written in different ways.
    ["Boeing 747-8", "B748"],
    ["Boeing 747-8I", "B748"],
    ["747-8i", "B748"],
    ["b748", "B748"],
    ["74H", "B748"],
    ["波音747-8", "B748"],
    ["Boeing 747-400", "B744"],
    ["B-747-400", "B744"],
    // Spaces, hyphens and upper or lower case do not matter.
    ["boeing  777 - 300er", "B77W"],
    ["77W", "B77W"],
    ["777-200ER", "B772"],
    ["Boeing 787-9 Dreamliner", "B789"],
    ["787-8", "B788"],
    ["787-10", "B78X"],
    ["737-800", "B738"],
    ["73H", "B738"],
    ["737-700", "B737"],
    ["737-900ER", "B739"],
    ["737 MAX 8", "B38M"],
    ["737-8", "B38M"],
    ["空客A320", "A320"],
    ["Airbus 320", "A320"],
    ["A320-214", "A320"],
    ["A320neo", "A20N"],
    ["A320-271N", "A20N"],
    ["32N", "A20N"],
    ["A321", "A321"],
    ["A321neo", "A21N"],
    ["A321LR", "A21N"],
    ["A319-100", "A319"],
    ["A330-200", "A332"],
    ["A330-343", "A333"],
    ["A330-900neo", "A339"],
    ["A350-900", "A359"],
    ["A350-941", "A359"],
    ["A350-1000", "A35K"],
    ["A380-800", "A388"],
    ["空中客车 A380", "A388"],
  ])("reads %j as %s", (text, expected) => {
    expect(aircraftTypeOf(text)).toBe(expected)
  })

  it.each<[string, AircraftTypeId]>([
    ["747", "B744"],
    ["Boeing 777", "B77W"],
    ["787", "B789"],
    ["Boeing 737", "B738"],
    ["A330", "A333"],
    ["A350", "A359"],
  ])("assumes the most common variant for %j", (text, expected) => {
    expect(aircraftTypeOf(text)).toBe(expected)
  })

  it("does not mistake a variant code for another family", () => {
    // The "321" here is an engine variant of the A330, not an A321.
    expect(aircraftTypeOf("A330-321")).toBe("A333")
    // And "330" inside a registration or a note is not an A330.
    expect(aircraftTypeOf("A320 (ship 3301)")).toBe("A320")
  })

  it.each([null, undefined, "", "   ", "C919", "ARJ21", "Embraer E190", "A340-600", "Boeing 767", "空客", "a plane"])(
    "returns null for %j",
    (text) => {
      expect(aircraftTypeOf(text)).toBeNull()
    },
  )
})
