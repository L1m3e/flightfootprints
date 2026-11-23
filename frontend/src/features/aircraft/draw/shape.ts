/**
 * The side view of one aircraft type, nose to the left. Everything is in aircraft
 * coordinates (see toSvgPath): metres, x aft from the nose, z up from the keel.
 */
export interface AircraftShape {
  /** Nose to the rearmost point. */
  length: number
  /** Highest point: the tip of the fin. */
  top: number
  /** Lowest point, usually the underside of an engine. Negative when below the keel. */
  bottom: number

  /** Closed outlines. */
  fuselage: string
  fin: string
  stabiliser: string
  wing: string
  /** The side windows of the cockpit. */
  cockpit: string

  /** Listed from the fuselage outwards, so that an outer engine is drawn over an inner one. */
  engines: readonly Engine[]
  /** The pods under the wing's trailing edge that house the flap mechanism: nose of each one and its length. */
  flapFairings?: readonly { x: number; z: number; length: number }[]
  windowRows: readonly WindowRow[]
  doors: readonly Door[]

  /** Height at which the paint of the upper fuselage meets the belly. Cheatlines run along it. */
  beltline: number
  /** Where the airline's name goes: start of the baseline, letter height and the room there is. */
  titles: { x: number; z: number; size: number; width: number }
  /** Centre and size of the airline's mark on the fin. */
  tailMark: { x: number; z: number; size: number }
}

export interface Engine {
  /** Front of the intake. */
  x: number
  /** Centre line. */
  z: number
  diameter: number
  /** Length of the wide cowl around the fan. */
  cowl: number
  /** Overall length, up to the tip of the exhaust cone. */
  length: number
  /** A sawtooth edge at the back of the cowl, as on the 787 and the 747-8. */
  chevrons?: boolean
  /** The point on the wing's leading edge that the pylon runs up to. */
  pylon: { x: number; z: number }
}

export interface WindowRow {
  /** Centre line of the row. */
  z: number
  /** Stretches of windows, each from one x to another. The gaps between them are doors. */
  spans: readonly (readonly [number, number])[]
}

export interface Door {
  /** Front edge. */
  x: number
  /** Sill. */
  z: number
  width: number
  height: number
}
