import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AIRLINES } from "@/features/aircraft/airlines"
import { AircraftDrawing } from "@/features/aircraft/draw/AircraftDrawing"
import { LIVERIES, PLAIN_LIVERY } from "@/features/aircraft/draw/liveries"
import { SHAPES } from "@/features/aircraft/draw/shapes"

const shapes = Object.entries(SHAPES)
const liveries = [...Object.entries(LIVERIES), ["plain", PLAIN_LIVERY] as const]

describe("AircraftDrawing", () => {
  // renderToStaticMarkup turns a component into the HTML it produces, without a browser.
  it("draws every aircraft in every livery", () => {
    for (const [type, shape] of shapes) {
      for (const [code, livery] of liveries) {
        const svg = renderToStaticMarkup(<AircraftDrawing shape={shape} livery={livery!} />)

        expect(svg, `${type} ${code}`).toMatch(/^<svg /)
        // A slip in the arithmetic shows up as one of these in a coordinate.
        expect(svg, `${type} ${code}`).not.toMatch(/NaN|undefined|Infinity/)
      }
    }
  })

  it("gives two drawings on one page different ids", () => {
    const shape = SHAPES.B748!
    const html = renderToStaticMarkup(
      <>
        <AircraftDrawing shape={shape} livery={PLAIN_LIVERY} />
        <AircraftDrawing shape={shape} livery={PLAIN_LIVERY} />
      </>,
    )

    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
    expect(ids.length).toBe(4)
    expect(new Set(ids).size).toBe(4)
  })

  it("is announced with its label, or hidden from screen readers without one", () => {
    const shape = SHAPES.B748!
    const labelled = renderToStaticMarkup(<AircraftDrawing shape={shape} livery={PLAIN_LIVERY} label="Boeing 747-8" />)
    const decorative = renderToStaticMarkup(<AircraftDrawing shape={shape} livery={PLAIN_LIVERY} />)

    expect(labelled).toContain('role="img"')
    expect(labelled).toContain('aria-label="Boeing 747-8"')
    expect(decorative).toContain('aria-hidden="true"')
  })

  it("writes the airline's name on the fuselage", () => {
    const svg = renderToStaticMarkup(<AircraftDrawing shape={SHAPES.B748!} livery={LIVERIES.CA!} />)

    expect(svg).toContain(">AIR CHINA</text>")
    expect(svg).toContain(">中国国际航空公司</text>")
  })
})

describe("shapes", () => {
  it.each(shapes)("%s is laid out inside its own outline", (_type, shape) => {
    expect(shape.bottom).toBeLessThan(0)
    expect(shape.beltline).toBeGreaterThan(0)
    expect(shape.top).toBeGreaterThan(shape.beltline)

    for (const row of shape.windowRows) {
      let previousEnd = 0
      for (const [from, to] of row.spans) {
        // Stretches of windows run front to back and do not overlap.
        expect(from).toBeGreaterThan(previousEnd)
        expect(to).toBeGreaterThan(from)
        expect(to).toBeLessThan(shape.length)
        previousEnd = to

        // No window sits where a door on the same deck is.
        for (const door of shape.doors) {
          const sameDeck = row.z > door.z && row.z < door.z + door.height
          const overlaps = from < door.x + door.width && to > door.x
          expect(sameDeck && overlaps, `windows ${from}–${to} and the door at ${door.x}`).toBe(false)
        }
      }
    }

    expect(shape.titles.x + shape.titles.width).toBeLessThan(shape.length)
    expect(shape.tailMark.z + shape.tailMark.size / 2).toBeLessThan(shape.top)
  })
})

describe("liveries", () => {
  it("only exist for airlines that can be recognised", () => {
    const known = new Set(AIRLINES.map((airline) => airline.iata))
    for (const code of Object.keys(LIVERIES)) {
      expect(known.has(code), code).toBe(true)
    }
  })
})
