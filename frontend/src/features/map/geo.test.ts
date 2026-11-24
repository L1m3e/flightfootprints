import type { Position } from "geojson"
import { describe, expect, it } from "vitest"

import type { Airport, Flight } from "@/features/flights/api"
import { boundsOf, buildAirportPoints, buildFlightArcs, greatCircleArc, routeCoordinates } from "@/features/map/geo"

const AIRPORTS = {
  PVG: { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "CN", lat: 31.1434, lon: 121.805 },
  NRT: { iata: "NRT", name: "Narita", city: "Narita", country: "JP", lat: 35.76858, lon: 140.388714 },
  LAX: { iata: "LAX", name: "Los Angeles", city: "Los Angeles", country: "US", lat: 33.942501, lon: -118.407997 },
  JFK: { iata: "JFK", name: "John F. Kennedy", city: "New York", country: "US", lat: 40.639447, lon: -73.779317 },
  HKG: { iata: "HKG", name: "Hong Kong", city: "Hong Kong", country: "HK", lat: 22.308901, lon: 113.914603 },
  WUH: { iata: "WUH", name: "Wuhan Tianhe", city: "Wuhan", country: "CN", lat: 30.774798, lon: 114.213723 },
  LHR: { iata: "LHR", name: "Heathrow", city: "London", country: "GB", lat: 51.470748, lon: -0.459909 },
  SYD: { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "AU", lat: -33.946098, lon: 151.177002 },
  SCL: { iata: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "CL", lat: -33.393, lon: -70.7858 },
} satisfies Record<string, Airport>

const position = (airport: Airport): Position => [airport.lon, airport.lat]

/** Haversine distance in km, written out here so the test does not lean on the code it checks. */
function distanceKm([lon1, lat1]: Position, [lon2, lat2]: Position): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a))
}

/** Length of the drawn line: the sum of all its little straight pieces. */
function drawnLengthKm(route: Position[]): number {
  let total = 0
  for (let i = 1; i < route.length; i++) total += distanceKm(route[i - 1], route[i])
  return total
}

/** The largest change of longitude from one point of the line to the next. */
function widestStep(route: Position[]): number {
  let widest = 0
  for (let i = 1; i < route.length; i++) widest = Math.max(widest, Math.abs(route[i][0] - route[i - 1][0]))
  return widest
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

describe("routeCoordinates", () => {
  const route = (from: keyof typeof AIRPORTS, to: keyof typeof AIRPORTS) =>
    routeCoordinates(position(AIRPORTS[from]), position(AIRPORTS[to]))

  it("starts and ends at the two airports", () => {
    const line = route("LHR", "JFK")

    expect(line[0]).toEqual(position(AIRPORTS.LHR))
    expect(line.at(-1)![0]).toBeCloseTo(AIRPORTS.JFK.lon, 6)
    expect(line.at(-1)![1]).toBeCloseTo(AIRPORTS.JFK.lat, 6)
  })

  it("bends towards the pole instead of following a straight line on the map", () => {
    const northernmost = Math.max(...route("LHR", "JFK").map(([, lat]) => lat))

    expect(northernmost).toBeGreaterThan(AIRPORTS.LHR.lat + 1)
  })

  // The three cases the map got wrong or must not break: over the Arctic and across the
  // 180° meridian, across it over the Pacific, and nowhere near it.
  it.each([
    ["HKG", "JFK"],
    ["JFK", "HKG"],
    ["LAX", "NRT"],
    ["NRT", "LAX"],
    ["PVG", "WUH"],
    ["PVG", "JFK"],
    ["SYD", "SCL"],
    ["LHR", "JFK"],
  ] as const)("never moves more than 180° of longitude in one step from %s to %s", (from, to) => {
    const line = route(from, to)

    expect(widestStep(line)).toBeLessThanOrEqual(180)
    // In fact the steps are small everywhere, also beside the pole.
    expect(widestStep(line)).toBeLessThan(15)
  })

  it("keeps counting past 180° on a route over the Arctic", () => {
    const line = route("HKG", "JFK")

    // Eastwards from Hong Kong at 114°: New York at -74° is reached as 286°.
    expect(line[0]).toEqual(position(AIRPORTS.HKG))
    expect(line.at(-1)![0]).toBeCloseTo(AIRPORTS.JFK.lon + 360, 6)
    expect(line.at(-1)![1]).toBeCloseTo(AIRPORTS.JFK.lat, 6)
    expect(Math.max(...line.map(([, lat]) => lat))).toBeGreaterThan(80)
  })

  it("keeps counting below -180° on a route westwards over the Pacific", () => {
    const line = route("LAX", "NRT")

    expect(line[0]).toEqual(position(AIRPORTS.LAX))
    // Westwards from Los Angeles at -118°: Tokyo at 140° is reached as -220°.
    expect(line.at(-1)![0]).toBeCloseTo(AIRPORTS.NRT.lon - 360, 6)
  })

  it("leaves a route that does not cross the 180° meridian between -180° and 180°", () => {
    const line = route("PVG", "WUH")

    expect(line.every(([lon]) => lon >= AIRPORTS.WUH.lon - 1e-9 && lon <= AIRPORTS.PVG.lon + 1e-9)).toBe(true)
  })

  it("has no point twice in a row", () => {
    for (const line of [route("LAX", "NRT"), route("HKG", "JFK"), route("SYD", "SCL")]) {
      for (let i = 1; i < line.length; i++) expect(line[i]).not.toEqual(line[i - 1])
    }
  })

  // The decisive check for "no hole and no detour": a gap at the meridian would make the
  // drawn line shorter than the real distance, a jump across the map far longer.
  it.each([
    ["PVG", "NRT"],
    ["PVG", "WUH"],
    ["LHR", "JFK"],
    ["NRT", "LAX"],
    ["SYD", "SCL"],
    ["PVG", "JFK"],
    ["HKG", "JFK"],
  ] as const)("draws %s to %s as long as the great-circle distance", (from, to) => {
    const expected = distanceKm(position(AIRPORTS[from]), position(AIRPORTS[to]))

    expect(drawnLengthKm(route(from, to)) / expected).toBeCloseTo(1, 3)
  })
})

describe("greatCircleArc", () => {
  it("is the route as one GeoJSON line", () => {
    const arc = greatCircleArc(position(AIRPORTS.HKG), position(AIRPORTS.JFK))

    expect(arc.type).toBe("LineString")
    expect(arc.coordinates).toEqual(routeCoordinates(position(AIRPORTS.HKG), position(AIRPORTS.JFK)))
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

  it("frames a route over the Arctic by the longitudes it really passes", () => {
    const [west, south, east, north] = boundsOf([greatCircleArc(position(AIRPORTS.HKG), position(AIRPORTS.JFK))])!

    expect(west).toBeCloseTo(AIRPORTS.HKG.lon, 3)
    expect(east).toBeCloseTo(AIRPORTS.JFK.lon + 360, 3)
    expect(south).toBeCloseTo(AIRPORTS.HKG.lat, 3)
    expect(north).toBeGreaterThan(80)
  })

  it("gives the same box whichever way the route was drawn", () => {
    const there = boundsOf([greatCircleArc(position(AIRPORTS.LAX), position(AIRPORTS.NRT))])!
    const back = boundsOf([greatCircleArc(position(AIRPORTS.NRT), position(AIRPORTS.LAX))])!

    there.forEach((value, index) => expect(value).toBeCloseTo(back[index], 6))
  })

  it("does not take the part of the map that a route across 180° already covers for a gap", () => {
    // Sydney to Santiago covers 151° eastwards to -71°. Los Angeles to New York lies inside
    // that stretch (New York is at -74°), so it must not move either edge of the box.
    const southPacific = greatCircleArc(position(AIRPORTS.SYD), position(AIRPORTS.SCL))
    const acrossAmerica = greatCircleArc(position(AIRPORTS.LAX), position(AIRPORTS.JFK))

    const [west, , east] = boundsOf([acrossAmerica, southPacific])!

    expect(west).toBeCloseTo(AIRPORTS.SYD.lon, 3)
    expect(east).toBeCloseTo(AIRPORTS.SCL.lon + 360, 3)
  })

  it("frames the whole world when the routes go all the way around it", () => {
    const [west, , east] = boundsOf([
      greatCircleArc(position(AIRPORTS.LHR), position(AIRPORTS.PVG)),
      greatCircleArc(position(AIRPORTS.PVG), position(AIRPORTS.LAX)),
      greatCircleArc(position(AIRPORTS.LAX), position(AIRPORTS.LHR)),
    ])!

    expect(east - west).toBeCloseTo(360, 6)
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
