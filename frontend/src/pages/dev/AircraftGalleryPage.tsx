import { AIRCRAFT_TYPES, type AircraftTypeId } from "@/features/aircraft/aircraftTypes"
import { AIRLINES } from "@/features/aircraft/airlines"
import { AircraftDrawing } from "@/features/aircraft/draw/AircraftDrawing"
import { LIVERIES, PLAIN_LIVERY } from "@/features/aircraft/draw/liveries"
import { SHAPES } from "@/features/aircraft/draw/shapes"

// The same band of sky the pages put behind a drawing.
const SKY = "bg-aircraft-sky"

/**
 * Every aircraft drawing in every livery on one page, at the two widths a flight card
 * has. For checking the drawings while working on them: the page only exists in the
 * development server and is left out of a production build.
 */
export function AircraftGalleryPage() {
  const liveries = [
    ...AIRLINES.filter((airline) => LIVERIES[airline.iata]).map((airline) => ({
      name: airline.name,
      livery: LIVERIES[airline.iata]!,
    })),
    { name: "No airline", livery: PLAIN_LIVERY },
  ]

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Aircraft drawings</h1>

      {(Object.keys(SHAPES) as AircraftTypeId[]).map((type) =>
        liveries.map(({ name, livery }) => (
          <section key={`${type}-${name}`} className="space-y-3">
            <h2 className="font-medium">
              {AIRCRAFT_TYPES[type].name} · {name}
            </h2>
            <div className={`rounded-xl px-6 py-5 ${SKY}`}>
              <AircraftDrawing
                shape={SHAPES[type]!}
                livery={livery}
                label={`${name} ${AIRCRAFT_TYPES[type].name}`}
                className="block h-auto w-full"
              />
            </div>
            {/* The width the drawing gets on a phone. */}
            <div className={`w-[295px] rounded-xl px-3 py-3 ${SKY}`}>
              <AircraftDrawing shape={SHAPES[type]!} livery={livery} className="block h-auto w-full" />
            </div>
          </section>
        )),
      )}
    </div>
  )
}
