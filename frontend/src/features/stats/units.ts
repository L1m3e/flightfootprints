/** Statute miles in one kilometre. */
export const MILES_PER_KM = 0.621371

/** Length of the equator in kilometres: one trip "around the Earth". */
export const EARTH_CIRCUMFERENCE_KM = 40_075

export function kmToMiles(km: number): number {
  return km * MILES_PER_KM
}

/** How many times the given distance would go around the equator. */
export function timesAroundEarth(km: number): number {
  return km / EARTH_CIRCUMFERENCE_KM
}
