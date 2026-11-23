import { cn } from "cn"

import { AircraftDrawing } from "@/features/aircraft/draw/AircraftDrawing"
import { drawingFor, type FlownAircraft } from "@/features/aircraft/drawingFor"

/**
 * The aircraft of a flight on a band of sky, or nothing at all when there is no drawing
 * for it. Pages only ever use this component, so how an aircraft gets drawn can change
 * without touching them.
 *
 * The text next to it already names the airline and the aircraft, so the picture is left
 * out for screen readers instead of being announced a second time.
 */
export function FlightAircraft({ flight, className }: { flight: FlownAircraft; className?: string }) {
  const drawing = drawingFor(flight)
  if (!drawing) return null

  return (
    <div className={cn("bg-aircraft-sky", className)}>
      <AircraftDrawing {...drawing} className="mx-auto block h-auto w-full max-w-lg" />
    </div>
  )
}
