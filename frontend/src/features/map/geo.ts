import { greatCircle } from "@turf/great-circle"
import type { Feature, FeatureCollection, LineString, Point, Position } from "geojson"

import type { Airport, Flight } from "@/features/flights/api"

/**
 * Points per route. Enough for a smooth curve at any zoom a world map is looked at, also
 * near the poles, where the map stretches every step of the line.
 */
const ARC_POINTS = 128

/**
 * The shortest path over the Earth's surface between two [longitude, latitude] points,
 * as one unbroken line.
 *
 * The line starts at `from` exactly as given. From there every point lies less than 180°
 * of longitude from the one before it, so a route across the 180° meridian keeps counting:
 * Hong Kong (114°) to New York (-74°) over the Arctic ends at 286°, which is the same
 * place as -74°. MapLibre accepts such longitudes and draws the line in one piece.
 *
 * The library that computes the path cannot be used as it is. Its longitudes stay between
 * -180 and 180, so somewhere a route like that jumps from one edge of the map to the
 * other. It cuts the line in two at the jump, but not near a pole, where the longitude
 * changes quickly from one point to the next: there it returns a single line with the jump
 * still in it, and the map connects the two points with a stroke across the whole world.
 */
export function routeCoordinates(from: Position, to: Position): Position[] {
  const geometry = greatCircle(from, to, { npoints: ARC_POINTS }).geometry
  const pieces = geometry.type === "MultiLineString" ? geometry.coordinates : [geometry.coordinates]

  const route: Position[] = []
  for (const [longitude, latitude] of pieces.flat()) {
    const previous = route.at(-1)
    let lon = longitude
    if (previous) {
      while (lon - previous[0] > 180) lon -= 360
      while (lon - previous[0] < -180) lon += 360
      // Where the library cut the line, both pieces have a point on the meridian. They
      // are the same place.
      if (lon === previous[0] && latitude === previous[1]) continue
    }
    route.push([lon, latitude])
  }
  return route
}

/** The route between two points as a GeoJSON line. See {@link routeCoordinates}. */
export function greatCircleArc(from: Position, to: Position): LineString {
  return { type: "LineString", coordinates: routeCoordinates(from, to) }
}

export interface FlightArcProperties {
  flightId: number
  /**
   * Position among the flights that share the same two airports, centred on zero:
   * 0 for a single flight, -0.5 and 0.5 for two, -1, 0 and 1 for three. The map shifts
   * each line sideways by this many steps, so identical routes lie next to each other
   * instead of on top of each other.
   */
  lane: number
}

/** One arc per flight. */
export function buildFlightArcs(flights: Flight[]): FeatureCollection<LineString, FlightArcProperties> {
  // "NRT-PVG" for both PVG to NRT and NRT to PVG: direction does not matter here.
  const byAirportPair = new Map<string, Flight[]>()
  for (const flight of flights) {
    const key = [flight.from.iata, flight.to.iata].sort().join("-")
    const group = byAirportPair.get(key)
    if (group) group.push(flight)
    else byAirportPair.set(key, [flight])
  }

  const features: Feature<LineString, FlightArcProperties>[] = []
  for (const group of byAirportPair.values()) {
    // Every line of a pair is drawn in the same direction, whichever way the flight went.
    // "Shift to the left of the line" then means the same side for all of them.
    const { from, to } = group[0]
    const [start, end] = from.iata < to.iata ? [from, to] : [to, from]
    const geometry = greatCircleArc([start.lon, start.lat], [end.lon, end.lat])

    const oldestFirst = [...group].sort((a, b) => a.flightDate.localeCompare(b.flightDate) || a.id - b.id)
    oldestFirst.forEach((flight, index) => {
      features.push({
        type: "Feature",
        geometry,
        properties: { flightId: flight.id, lane: index - (oldestFirst.length - 1) / 2 },
      })
    })
  }
  return { type: "FeatureCollection", features }
}

export interface AirportPointProperties {
  iata: string
  name: string
  /** How many flights start or end here. */
  flights: number
}

/** One point per airport that appears in any flight. */
export function buildAirportPoints(flights: Flight[]): FeatureCollection<Point, AirportPointProperties> {
  const visits = new Map<string, { airport: Airport; flights: number }>()
  for (const flight of flights) {
    for (const airport of [flight.from, flight.to]) {
      const entry = visits.get(airport.iata)
      if (entry) entry.flights++
      else visits.set(airport.iata, { airport, flights: 1 })
    }
  }

  return {
    type: "FeatureCollection",
    features: [...visits.values()].map(({ airport, flights: count }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [airport.lon, airport.lat] },
      properties: { iata: airport.iata, name: airport.name, flights: count },
    })),
  }
}

/** West, south, east, north. East may exceed 180 when the box spans the 180° meridian. */
export type Bounds = [west: number, south: number, east: number, north: number]

/** Brings a longitude into the range from -180 (included) to 180 (not included). */
function wrapLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180
}

/**
 * The smallest box that contains all the given routes, or null when there are none.
 *
 * Longitude wraps around, so "smallest" needs care: flights between Asia and America
 * are best framed across the Pacific (east edge beyond 180), not across the Atlantic.
 * Every route covers one stretch of longitudes, from its westernmost point to its
 * easternmost. Going once around the globe, the widest stretch that no route covers is
 * found, and the box is everything except that stretch.
 */
export function boundsOf(routes: LineString[]): Bounds | null {
  const points = routes.flatMap((route) => route.coordinates)
  if (points.length === 0) return null

  const stretches = routes
    .filter((route) => route.coordinates.length > 0)
    .map((route) => {
      // The longitudes of one route are continuous (see routeCoordinates), so its lowest
      // and highest are its two ends on the map, also when the route crosses 180°.
      const longitudes = route.coordinates.map(([lon]) => lon)
      const west = Math.min(...longitudes)
      const start = wrapLongitude(west)
      return { start, end: start + Math.min(Math.max(...longitudes) - west, 360) }
    })
    .sort((a, b) => a.start - b.start)

  // Going around a second time. On the first lap a stretch that runs past 180° has not
  // been seen yet when the list starts, although it covers the beginning of it; on the
  // second lap everything that covers a longitude is already known.
  let west = -180
  let widestGap = 0
  let coveredUntil = Math.max(...stretches.map((stretch) => stretch.end))
  for (const stretch of stretches) {
    const start = stretch.start + 360
    if (start - coveredUntil > widestGap) {
      widestGap = start - coveredUntil
      west = stretch.start
    }
    coveredUntil = Math.max(coveredUntil, stretch.end + 360)
  }

  const latitudes = points.map(([, lat]) => lat)
  return [west, Math.min(...latitudes), west + (360 - widestGap), Math.max(...latitudes)]
}
