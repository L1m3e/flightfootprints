import type { AircraftTypeId } from "@/features/aircraft/aircraftTypes"
import type { AircraftShape } from "@/features/aircraft/draw/shape"
import { B748 } from "@/features/aircraft/draw/shapes/b748"

/** The aircraft types that have a drawing so far. */
export const SHAPES: Partial<Record<AircraftTypeId, AircraftShape>> = {
  B748,
}
