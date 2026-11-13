import { greatCircle } from "@turf/great-circle"
import type { Feature, FeatureCollection, LineString, MultiLineString, Point, Position } from "geojson"

import type { Airport, Flight } from "@/features/flights/api"

/**
 * One line for most routes. A route across the 180° meridian is two lines, one on each
 * side of the map, that meet exactly on the meridian.
 */
export type ArcGeometry = LineString | MultiLineString

/** Points per arc. Enough for a smooth curve at any zoom a world map is looked at. */
const ARC_POINTS = 96

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/**
 * The shortest path over the Earth's surface between two [longitude, latitude] points.
 */
export function greatCircleArc(from: Position, to: Position): ArcGeometry {
  const geometry = greatCircle(from, to, { npoints: ARC_POINTS }).geometry
  return geometry.type === "MultiLineString" ? closeMeridianGap(geometry) : geometry
}

/**
 * turf splits a route that crosses the 180° meridian into two lines, but neither of them
 * reaches the meridian: the piece between the last point before it and the first point
 * after it is simply missing, which shows as a hole in the drawn route. This adds the
 * crossing point to both lines so they meet.
 */
function closeMeridianGap(geometry: MultiLineString): MultiLineString {
  const parts = geometry.coordinates.map((part) => [...part])

  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i][parts[i].length - 1]
    const after = parts[i + 1][0]

    // The first line stops just short of +180 (heading east) or -180 (heading west).
    const edge = before[0] >= 0 ? 180 : -180
    // Express `after` on the same side as `before`: -178 becomes 182 when heading east.
    const afterSameSide: Position = [after[0] + 2 * edge, after[1]]
    const latitude = latitudeOnGreatCircle(before, afterSameSide, edge)

    if (before[0] !== edge) parts[i].push([edge, latitude])
    if (after[0] !== -edge) parts[i + 1].unshift([-edge, latitude])
  }
  return { type: "MultiLineString", coordinates: parts }
}

/**
 * Latitude at which the great circle through `a` and `b` crosses the given longitude.
 * Formula from Ed Williams' Aviation Formulary ("Latitude of point on GC").
 */
function latitudeOnGreatCircle(a: Position, b: Position, longitude: number): number {
  const [lon1, lat1] = a.map(toRadians)
  const [lon2, lat2] = b.map(toRadians)
  const lon = toRadians(longitude)

  const denominator = Math.cos(lat1) * Math.cos(lat2) * Math.sin(lon1 - lon2)
  if (Math.abs(denominator) < 1e-12) {
    // Both points on one meridian: the path runs straight along it.
    return (a[1] + b[1]) / 2
  }
  const numerator =
    Math.sin(lat1) * Math.cos(lat2) * Math.sin(lon - lon2) - Math.sin(lat2) * Math.cos(lat1) * Math.sin(lon - lon1)
  return toDegrees(Math.atan(numerator / denominator))
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
export function buildFlightArcs(flights: Flight[]): FeatureCollection<ArcGeometry, FlightArcProperties> {
  // "NRT-PVG" for both PVG to NRT and NRT to PVG: direction does not matter here.
  const byAirportPair = new Map<string, Flight[]>()
  for (const flight of flights) {
    const key = [flight.from.iata, flight.to.iata].sort().join("-")
    const group = byAirportPair.get(key)
    if (group) group.push(flight)
    else byAirportPair.set(key, [flight])
  }

  const features: Feature<ArcGeometry, FlightArcProperties>[] = []
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

function coordinatesOf(geometry: ArcGeometry): Position[] {
  return geometry.type === "LineString" ? geometry.coordinates : geometry.coordinates.flat()
}

/**
 * The smallest box that contains all the given arcs, or null when there are none.
 *
 * Longitude wraps around, so "smallest" needs care: flights between Asia and America
 * are best framed across the Pacific (east edge beyond 180), not across the Atlantic.
 * The longitudes are sorted around the globe, the widest empty stretch between two
 * neighbours is found, and the box covers everything except that stretch.
 */
export function boundsOf(geometries: ArcGeometry[]): Bounds | null {
  const points = geometries.flatMap(coordinatesOf)
  if (points.length === 0) return null

  const longitudes = [...new Set(points.map(([lon]) => (lon === 180 ? -180 : lon)))].sort((a, b) => a - b)
  let west = longitudes[0]
  let widestGap = longitudes[0] + 360 - longitudes[longitudes.length - 1]
  for (let i = 1; i < longitudes.length; i++) {
    const gap = longitudes[i] - longitudes[i - 1]
    if (gap > widestGap) {
      widestGap = gap
      west = longitudes[i]
    }
  }
  const east = west + (360 - widestGap)

  const latitudes = points.map(([, lat]) => lat)
  return [west, Math.min(...latitudes), east, Math.max(...latitudes)]
}
