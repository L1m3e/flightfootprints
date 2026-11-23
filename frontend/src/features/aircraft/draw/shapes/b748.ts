import type { AircraftShape, Door } from "@/features/aircraft/draw/shape"

// Boeing 747-8 Intercontinental.
//
// Overall figures are Boeing's published ones: 76.3 m long, 19.4 m to the tip of the fin
// (about 17.2 m above the keel, which sits some 2.2 m off the ground), 68.4 m wingspan
// with 37.5° of sweep, four GEnx-2B engines with a 2.7 m fan. The fuselage is 7.1 m deep,
// 8.05 m where the upper deck sits on top. Positions of doors and windows are estimated
// from the cabin layout and are good to a metre or so.

/** A main-deck door, by the position of its centre. */
function mainDoor(centre: number): Door {
  return { x: centre - 0.535, z: 2.95, width: 1.07, height: 1.9 }
}

export const B748: AircraftShape = {
  length: 76.3,
  top: 17.25,
  bottom: -0.95,

  fuselage: `
    M 0 3.0
    C 0 3.9, 1.2 5.3, 3.0 6.35
    L 4.7 7.45
    C 5.9 7.95, 7.2 8.05, 8.8 8.05
    L 25.5 8.05
    C 28.8 8.05, 30.4 7.1, 33.8 7.1
    L 57.0 7.1
    C 63.5 7.1, 69.5 6.4, 73.9 5.6
    C 74.25 5.52, 74.25 5.08, 73.9 5.0
    C 70.0 4.25, 63.5 2.45, 58.0 1.1
    C 55.0 0.35, 52.5 0, 49.5 0
    L 45.6 0
    C 44.2 0, 43.3 -0.55, 41.6 -0.55
    L 29.6 -0.55
    C 27.9 -0.55, 27.0 0, 25.6 0
    L 10.5 0
    C 6.5 0, 3.2 0.5, 1.6 1.4
    C 0.6 1.95, 0 2.4, 0 3.0
    Z`,

  // The base reaches down into the fuselage, which is drawn over it.
  fin: `
    M 55.5 6.0
    L 56.0 7.1
    C 57.6 7.2, 58.6 7.5, 59.6 8.3
    L 70.3 17.0
    C 70.5 17.18, 70.8 17.25, 71.2 17.25
    L 74.4 17.25
    C 74.8 17.25, 75.0 17.05, 74.9 16.7
    L 71.7 6.0
    Z`,

  // Seen from the side, a swept surface with dihedral shows as a blade that climbs towards
  // its tip: the tip is further aft because of the sweep and higher because of the dihedral.
  stabiliser: `
    M 62.4 5.25
    L 73.2 6.6
    C 74.4 6.75, 75.8 6.7, 76.3 6.5
    L 70.9 5.0
    L 63.2 4.85
    Z`,

  // The last stretch, more sharply swept, is the 747-8's raked wingtip.
  wing: `
    M 25.3 1.2
    C 25.0 1.4, 25.1 1.7, 25.8 1.85
    L 54.0 5.6
    L 57.4 5.95
    L 55.6 5.45
    L 43.8 2.4
    L 40.8 1.45
    L 40.8 1.0
    Z`,

  cockpit: `
    M 3.35 6.5 L 4.55 7.28 L 5.05 7.3 L 4.75 6.55 Z
    M 4.95 6.55 L 5.25 7.3 L 6.0 7.3 L 6.0 6.6 Z`,

  engines: [
    { x: 27.4, z: 0.7, diameter: 3.2, cowl: 3.7, length: 5.9, chevrons: true, pylon: { x: 33.0, z: 2.75 } },
    { x: 36.0, z: 1.6, diameter: 3.2, cowl: 3.7, length: 5.9, chevrons: true, pylon: { x: 41.3, z: 3.85 } },
  ],

  flapFairings: [
    { x: 38.4, z: 1.05, length: 3.6 },
    { x: 41.9, z: 1.95, length: 3.3 },
    { x: 45.7, z: 2.95, length: 3.0 },
    { x: 49.5, z: 3.95, length: 2.6 },
  ],

  windowRows: [
    // Main deck. It runs all the way into the nose, under the cockpit.
    {
      z: 4.05,
      spans: [
        [4.4, 6.2],
        [7.9, 15.7],
        [17.3, 32.3],
        [33.9, 45.8],
        [47.4, 60.8],
        [62.4, 64.4],
      ],
    },
    // Upper deck, which the Intercontinental stretches back to the wing.
    {
      z: 6.75,
      spans: [
        [7.6, 23.9],
        [25.3, 27.0],
      ],
    },
  ],

  doors: [
    mainDoor(7.0),
    mainDoor(16.5),
    mainDoor(33.1),
    mainDoor(46.6),
    mainDoor(61.6),
    // Upper deck.
    { x: 24.15, z: 5.7, width: 0.9, height: 1.45 },
  ],

  beltline: 2.9,
  // On the 747 the name sits between the two rows of windows.
  titles: { x: 8.4, z: 5.2, size: 0.95, width: 15.0 },
  tailMark: { x: 69.5, z: 12.2, size: 5.4 },
}
