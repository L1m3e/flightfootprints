import { describe, expect, it } from "vitest"

import { toSvgPath } from "@/features/aircraft/draw/sketch"

describe("toSvgPath", () => {
  it("scales metres to drawing units and turns heights upside down", () => {
    // With the top at 20 m, a point 5 m up is 15 m, or 150 units, down from the top.
    expect(toSvgPath("M 0 5 L 76.3 5 Z", 20)).toBe("M 0 150 L 763 150 Z")
  })

  it("puts what is below the keel further down", () => {
    expect(toSvgPath("M 10 -0.55", 20)).toBe("M 100 205.5")
  })

  it("converts every pair of a curve, however the numbers are separated", () => {
    expect(toSvgPath("M 0 3\n  C 0 3.9, 1.2 5.3,3 6.35", 10)).toBe("M 0 70 C 0 61 12 47 30 36.5")
  })

  it("leaves no floating-point noise in the output", () => {
    // 17.25 - 0.1 is 17.149999999999999 in binary floating point.
    expect(toSvgPath("M 0.1 0.1", 17.25)).toBe("M 1 171.5")
  })

  it("rejects commands whose arguments are not coordinate pairs", () => {
    // H takes a single x, A takes radii and flags: converting them pairwise would be wrong.
    expect(() => toSvgPath("M 0 0 H 10", 10)).toThrow(/Unsupported path command "H"/)
    expect(() => toSvgPath("M 0 0 A 5 5 0 0 1 10 10", 10)).toThrow(/Unsupported path command "A"/)
    // Lower-case commands are relative, and a relative height must not be flipped around `top`.
    expect(() => toSvgPath("M 0 0 l 1 1", 10)).toThrow(/Unsupported path command "l"/)
  })

  it("rejects a path with a coordinate missing", () => {
    expect(() => toSvgPath("M 0 0 L 5 Z", 10)).toThrow(/incomplete/)
  })
})
