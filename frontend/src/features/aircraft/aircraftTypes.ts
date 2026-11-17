/**
 * The aircraft types this site knows, keyed by their ICAO type designator (the code
 * air traffic control uses, e.g. B748 for the Boeing 747-8).
 */
export const AIRCRAFT_TYPES = {
  A319: { name: "Airbus A319" },
  A320: { name: "Airbus A320" },
  A20N: { name: "Airbus A320neo" },
  A321: { name: "Airbus A321" },
  A21N: { name: "Airbus A321neo" },
  A332: { name: "Airbus A330-200" },
  A333: { name: "Airbus A330-300" },
  A339: { name: "Airbus A330-900" },
  A359: { name: "Airbus A350-900" },
  A35K: { name: "Airbus A350-1000" },
  A388: { name: "Airbus A380" },
  B737: { name: "Boeing 737-700" },
  B738: { name: "Boeing 737-800" },
  B739: { name: "Boeing 737-900" },
  B38M: { name: "Boeing 737 MAX 8" },
  B744: { name: "Boeing 747-400" },
  B748: { name: "Boeing 747-8" },
  B772: { name: "Boeing 777-200" },
  B77W: { name: "Boeing 777-300ER" },
  B788: { name: "Boeing 787-8" },
  B789: { name: "Boeing 787-9" },
  B78X: { name: "Boeing 787-10" },
} as const

export type AircraftTypeId = keyof typeof AIRCRAFT_TYPES

/**
 * Booking sites and boarding passes often show the three-character IATA code instead.
 * Only the codes that differ from the plain model number need to be listed: "320" or
 * "747" are read as model numbers further down.
 */
const IATA_CODES: Record<string, AircraftTypeId> = {
  "32A": "A320",
  "32S": "A320",
  "32N": "A20N",
  "32B": "A321",
  "32Q": "A21N",
  "332": "A332",
  "333": "A333",
  "339": "A339",
  "359": "A359",
  "351": "A35K",
  "388": "A388",
  "73G": "B737",
  "73W": "B737",
  "738": "B738",
  "73H": "B738",
  "739": "B739",
  "73J": "B739",
  "7M8": "B38M",
  "744": "B744",
  "74E": "B744",
  "74H": "B748",
  "74N": "B748",
  "772": "B772",
  "77L": "B772",
  "773": "B77W",
  "77W": "B77W",
  "788": "B788",
  "789": "B789",
  "781": "B78X",
}

/**
 * Works out the aircraft type from what was typed into the free-text "aircraft" field.
 * People write the same type in many ways ("Boeing 747-8", "B748", "747-8i", "波音747-8"),
 * so the text is reduced to letters and digits first and then read as a code or as a
 * model number followed by a variant.
 *
 * Returns null for anything it does not recognise, including types that are not in
 * {@link AIRCRAFT_TYPES}.
 */
export function aircraftTypeOf(text: string | null | undefined): AircraftTypeId | null {
  if (!text) return null

  const code = text
    .toUpperCase()
    .replace(/BOEING|AIRBUS|波音|空中客车|空客/g, "")
    .replace(/[^A-Z0-9]/g, "")

  if (code in AIRCRAFT_TYPES) return code as AircraftTypeId
  if (code in IATA_CODES) return IATA_CODES[code]

  // "A330300" is model 330, variant "300". The letter in front is optional: "747-8".
  const match = /^[AB]?(\d{3})(.*)$/.exec(code)
  if (!match) return null
  const [, model, variant] = match

  // The re-engined Airbus types are sold as "neo"; their exact variant codes end in N
  // (A320-271N), and the long-range A321LR and A321XLR only exist as neo.
  const neo = /NEO|LR|^\d{3}N/.test(variant)

  // Without a variant, the most common member of the family is assumed.
  switch (model) {
    case "319":
      return "A319"
    case "320":
      return neo ? "A20N" : "A320"
    case "321":
      return neo ? "A21N" : "A321"
    case "330":
      if (variant.startsWith("2")) return "A332"
      return variant.startsWith("9") || neo ? "A339" : "A333"
    case "350":
      return variant.startsWith("10") ? "A35K" : "A359"
    case "380":
      return "A388"
    case "737":
      // Boeing's own name for the 737 MAX 8 is "737-8".
      if (variant.includes("MAX") || variant === "8") return "B38M"
      if (variant.startsWith("7")) return "B737"
      return variant.startsWith("9") ? "B739" : "B738"
    case "747":
      return variant.startsWith("8") ? "B748" : "B744"
    case "777":
      return variant.startsWith("2") ? "B772" : "B77W"
    case "787":
      if (variant.startsWith("10")) return "B78X"
      return variant.startsWith("8") ? "B788" : "B789"
    default:
      return null
  }
}
