# Aircraft drawings

How a flight gets its picture, and how to add a drawing.

## From a flight to a picture

```
flight (flightNo, airline, aircraft)
  │
  ├─ airlineOf()        airlines.ts         which airline            CA818      → CA
  ├─ aircraftTypeOf()   aircraftTypes.ts    which aircraft type      747-8i     → B748
  │
  └─ drawingFor()       drawingFor.ts       shape + livery, or nothing
       │
       └─ <FlightAircraft>   FlightAircraft.tsx   the picture on its band of sky
```

Pages only use `<FlightAircraft flight={flight} />`: the timeline card
(`features/flights/FlightCard.tsx`) and the flight details on the map
(`features/map/FlightDetails.tsx`). `drawingFor()` is the single place that decides what
is drawn:

- aircraft type not recognised, or recognised but not drawn yet: no picture at all. A
  wrong aircraft would be worse than none.
- airline not recognised, or without a livery yet: the unpainted aircraft
  (`PLAIN_LIVERY`).

## What exists

|                | Recognised                               | Drawn              |
| -------------- | ---------------------------------------- | ------------------ |
| Aircraft types | 22, see `AIRCRAFT_TYPES`                 | `B748` (747-8)     |
| Airlines       | 110, see `AIRLINES`                      | `CA` (Air China)   |

The 747-8 and the Air China livery are first drawings that prove the pipeline works.
They may be replaced.

## The look to aim for

- An exact side view, nose to the right, in realistic proportions. Simple, but not a
  cartoon. (The 747-8 that is already there still faces left; it was drawn before this
  was settled.)
- Flat fills, no gradients or shadows: white upper fuselage, light grey belly, wing,
  engines and tailplane. Thin dark outlines.
- The livery on top: cheatline, a row of small windows, door outlines, cockpit windows,
  the national flag where the airline carries one, the airline's name in Latin and
  Chinese characters, the logo on the fin.
- Details that tell the type apart: the 747's hump, raked wingtips, the sawtooth edge of
  the engine cowls.
- Shown on a band of one colour (`bg-aircraft-sky`, set in `src/index.css`).

Only artwork made for this project, or with a licence that clearly allows the use, may
be added. Nothing traced or copied from another site or app.

## Seeing the drawings

```bash
npm run dev
```

Then open <http://localhost:5173/dev/aircraft>: every shape in every livery, at the width
of a flight card and at the width of a phone. The page exists in the development server
only and is left out of a production build.

## Adding an aircraft type

1. Write the shape in `draw/shapes/<id>.ts` as an `AircraftShape`. Every field is
   described in `draw/shape.ts`; `draw/shapes/b748.ts` is a complete example.
2. Register it in `draw/shapes/index.ts` under its ICAO type designator (`A320`, `B77W`).
3. If the type is not in `AIRCRAFT_TYPES` yet, add it there and teach `aircraftTypeOf()`
   the ways people write it, with tests in `aircraftTypes.test.ts`.

Coordinates are in metres, the way aircraft dimensions are published: `x` runs aft from
the tip of the nose, `z` runs up from the keel (the underside of the cabin section).
`toSvgPath()` in `draw/sketch.ts` turns them into SVG coordinates. Outlines are path
data restricted to the absolute commands `M L C Q Z`.

## Adding a livery

1. Add an entry to `LIVERIES` in `draw/liveries.ts` under the airline's IATA designator.
   The `Livery` type lists what can be set: colours, cheatlines, name, flag, tail mark.
2. The tail mark is a component in `draw/tailMarks.tsx`, drawn in a box of 100 × 100
   units. It is placed and cut to the outline of the fin automatically.
3. A new flag needs a case in `draw/Flag.tsx` and its proportions in `draw/flags.ts`.
4. If the airline is not in `AIRLINES` (`airlines.ts`) yet, add it there with its ICAO
   designator and the names people use for it.

## If the drawings come as finished image files

Splitting a picture into shape and livery is one way to do it, not a requirement. If
drawings are delivered as one SVG per aircraft type and airline, change what
`drawingFor()` returns and what `<FlightAircraft>` renders. Nothing else in the app
depends on how a drawing is made. Keep the two rules above: no picture for an unknown
type, the unpainted aircraft for an unknown airline.

Finished files go into `frontend/src/assets/aircraft/`, one aircraft per file, named
after the ICAO type designator and the IATA airline designator: `B748_CA.svg` is a 747-8
of Air China, `B748.svg` the unpainted 747-8. SVG with a transparent background is
preferred; a PNG at least 2400 pixels wide works too.

## Checks

```bash
npm test && npm run typecheck && npm run lint
```

The tests render every shape in every livery and look for broken numbers, check that
windows, doors and lettering of a shape lie inside it and do not overlap, and check that
a livery only exists for an airline that can be recognised.
