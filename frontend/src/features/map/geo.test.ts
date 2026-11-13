import type { Position } from "geojson"
import { describe, expect, it } from "vitest"

import type { Airport, Flight } from "@/features/flights/api"
import { boundsOf, buildAirportPoints, buildFlightArcs, greatCircleArc, type ArcGeometry } from "@/features/map/geo"

const AIRPORTS = {
  PVG: { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "CN", lat: 31.1434, lon: 121.805 },
  NRT: { iata: "NRT", name: "Narita", city: "Narita", country: "JP", lat: 35.76858, lon: 140.388714 },
  LAX: { iata: "LAX", name: "Los Angeles", city: "Los Angeles", country: "US", lat: 33.942501, lon: -118.407997 },
  JFK: { iata: "JFK", name: "John F. Kennedy", city: "New York", country: "US", lat: 40.639447, lon: -73.779317 },
  LHR: { iata: "LHR", name: "Heathrow", city: "London", country: "GB", lat: 51.470748, lon: -0.459909 },
  SYD: { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "AU", lat: -33.946098, lon: 151.177002 },
  SCL: { iata: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "CL", lat: -33.393, lon: -70.7858 },
} satisfies Record<string, Airport>

const position = (airport: Airport): Position => [airport.lon, airport.lat]

function parts(geometry: ArcGeometry): Position[][] {
  return geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates
}

/** Haversine distance in km, written out here so the test does not lean on the code it checks. */
function distanceKm([lon1, lat1]: Position, [lon2, lat2]: Position): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a))
}

/** Length of the drawn line: the sum of all its little straight pieces. */
function drawnLengthKm(geometry: ArcGeometry): number {
  let total = 0
  for (const part of parts(geometry)) {
    for (let i = 1; i < part.length; i++) total += distanceKm(part[i - 1], part[i])
  }
  return total
}

let nextId = 1
function flight(from: Airport, to: Airport, flightDate = "2024-01-01"): Flight {
  return {
    id: nextId++,
    flightDate,
    flightNo: null,
    airline: "Test Air",
    from,
    to,
    aircraft: null,
    seat: null,
    cabin: null,
    distanceKm: Math.round(distanceKm(position(from), position(to))),
    notes: null,
  }
}

describe("greatCircleArc", () => {
  it("draws a route that stays on one side of the map as a single line between the two airports", () => {
    const arc = greatCircleArc(position(AIRPORTS.LHR), position(AIRPORTS.JFK))

    expect(arc.type).toBe("LineString")
    const [line] = parts(arc)
    expect(line[0]).toEqual(position(AIRPORTS.LHR))
    expect(line[line.length - 1][0]).toBeCloseTo(AIRPORTS.JFK.lon, 6)
    expect(line[line.length - 1][1]).toBeCloseTo(AIRPORTS.JFK.lat, 6)
  })

  it("bends towards the pole instead of following a straight line on the map", () => {
    const arc = greatCircleArc(position(AIRPORTS.LHR), position(AIRPORTS.JFK))

    const northernmost = Math.max(...parts(arc)[0].map(([, lat]) => lat))
    expect(northernmost).toBeGreaterThan(AIRPORTS.LHR.lat + 1)
  })

  // Tokyo to Los Angeles over the Pacific, Sydney to Santiago over the South Pacific,
  // Shanghai to New York over the Arctic: all three cross the 180° meridian.
  it.each([
    ["NRT", "LAX"],
    ["LAX", "NRT"],
    ["SYD", "SCL"],
    ["PVG", "JFK"],
    ["JFK", "PVG"],
  ] as const)("joins the two halves of %s to %s exactly on the 180° meridian", (from, to) => {
    const arc = greatCircleArc(position(AIRPORTS[from]), position(AIRPORTS[to]))

    expect(arc.type).toBe("MultiLineString")
    const [first, second] = parts(arc)
    const lastOfFirst = first[first.length - 1]
    const firstOfSecond = second[0]

    // One half ends at +180 and the other starts at -180 (the same place on Earth) ...
    expect(Math.abs(lastOfFirst[0])).toBe(180)
    expect(firstOfSecond[0]).toBe(-lastOfFirst[0])
    // ... at the same latitude.
    expect(firstOfSecond[1]).toBe(lastOfFirst[1])
  })

  // The decisive check for "no hole in the line": with a gap at the meridian the drawn
  // line would come out 1 to 2 % shorter than the real distance.
  it.each([
    ["PVG", "NRT"],
    ["LHR", "JFK"],
    ["NRT", "LAX"],
    ["SYD", "SCL"],
    ["PVG", "JFK"],
  ] as const)("draws %s to %s as long as the great-circle distance", (from, to) => {
    const arc = greatCircleArc(position(AIRPORTS[from]), position(AIRPORTS[to]))

    const expected = distanceKm(position(AIRPORTS[from]), position(AIRPORTS[to]))
    expect(drawnLengthKm(arc) / expected).toBeCloseTo(1, 3)
  })

  it("never jumps across the map inside one line", () => {
    for (const [from, to] of [
      ["NRT", "LAX"],
      ["PVG", "JFK"],
      ["SYD", "SCL"],
      ["LHR", "JFK"],
    ] as const) {
      const arc = greatCircleArc(position(AIRPORTS[from]), position(AIRPORTS[to]))
      for (const part of parts(arc)) {
        for (let i = 1; i < part.length; i++) {
          expect(Math.abs(part[i][0] - part[i - 1][0])).toBeLessThan(30)
          expect(Math.abs(part[i][0])).toBeLessThanOrEqual(180)
        }
      }
    }
  })
})

describe("buildFlightArcs", () => {
  it("makes one arc per flight", () => {
    const flights = [flight(AIRPORTS.PVG, AIRPORTS.NRT), flight(AIRPORTS.LHR, AIRPORTS.JFK)]

    const arcs = buildFlightArcs(flights)

    expect(arcs.features.map((feature) => feature.properties.flightId).sort()).toEqual(flights.map((f) => f.id).sort())
    expect(arcs.features.every((feature) => feature.properties.lane === 0)).toBe(true)
  })

  it("puts flights between the same two airports in neighbouring lanes, whichever way they went", () => {
    const outbound = flight(AIRPORTS.PVG, AIRPORTS.NRT, "2024-03-01")
    const back = flight(AIRPORTS.NRT, AIRPORTS.PVG, "2024-03-08")
    const again = flight(AIRPORTS.PVG, AIRPORTS.NRT, "2025-01-15")

    const arcs = buildFlightArcs([again, back, outbound])
    const laneOf = (id: number) => arcs.features.find((feature) => feature.properties.flightId === id)!.properties.lane

    // Oldest first, centred on zero.
    expect([laneOf(outbound.id), laneOf(back.id), laneOf(again.id)]).toEqual([-1, 0, 1])
    // All three use the very same line, drawn in one direction, so the sideways shift
    // moves each of them to a different side instead of mirroring the return flight.
    const [first, ...rest] = arcs.features
    expect(rest.every((feature) => feature.geometry === first.geometry)).toBe(true)
  })

  it("centres two flights on the same route around the real line", () => {
    const arcs = buildFlightArcs([flight(AIRPORTS.LHR, AIRPORTS.JFK), flight(AIRPORTS.JFK, AIRPORTS.LHR)])

    expect(arcs.features.map((feature) => feature.properties.lane).sort()).toEqual([-0.5, 0.5])
  })
})

describe("buildAirportPoints", () => {
  it("lists every airport once and counts the flights that touch it", () => {
    const points = buildAirportPoints([
      flight(AIRPORTS.PVG, AIRPORTS.NRT),
      flight(AIRPORTS.NRT, AIRPORTS.LAX),
      flight(AIRPORTS.NRT, AIRPORTS.PVG),
    ])

    const counts = Object.fromEntries(points.features.map((f) => [f.properties.iata, f.properties.flights]))
    expect(counts).toEqual({ PVG: 2, NRT: 3, LAX: 1 })
    const nrt = points.features.find((f) => f.properties.iata === "NRT")!
    expect(nrt.geometry.coordinates).toEqual(position(AIRPORTS.NRT))
  })
})

describe("boundsOf", () => {
  it("has nothing to frame without flights", () => {
    expect(boundsOf([])).toBeNull()
  })

  it("frames a route that stays on one side of the map with an ordinary box", () => {
    const [west, south, east, north] = boundsOf([greatCircleArc(position(AIRPORTS.LHR), position(AIRPORTS.JFK))])!

    expect(west).toBeCloseTo(AIRPORTS.JFK.lon, 3)
    expect(east).toBeCloseTo(AIRPORTS.LHR.lon, 3)
    expect(south).toBeCloseTo(AIRPORTS.JFK.lat, 3)
    // The arc bulges north of both airports.
    expect(north).toBeGreaterThan(AIRPORTS.LHR.lat)
  })

  it("frames a Pacific route across the 180° meridian, not the long way round", () => {
    const [west, , east] = boundsOf([greatCircleArc(position(AIRPORTS.NRT), position(AIRPORTS.LAX))])!

    expect(west).toBeCloseTo(AIRPORTS.NRT.lon, 3)
    // Los Angeles at -118.4 is 241.6 when counted eastwards from Tokyo.
    expect(east).toBeCloseTo(AIRPORTS.LAX.lon + 360, 3)
    expect(east - west).toBeLessThan(110)
  })

  it("covers all routes when there are several", () => {
    const [west, south, east, north] = boundsOf([
      greatCircleArc(position(AIRPORTS.PVG), position(AIRPORTS.NRT)),
      greatCircleArc(position(AIRPORTS.SYD), position(AIRPORTS.SCL)),
    ])!

    expect(west).toBeCloseTo(AIRPORTS.PVG.lon, 3)
    expect(east).toBeCloseTo(AIRPORTS.SCL.lon + 360, 3)
    expect(north).toBeCloseTo(AIRPORTS.NRT.lat, 1)
    expect(south).toBeLessThan(AIRPORTS.SYD.lat)
  })
})
