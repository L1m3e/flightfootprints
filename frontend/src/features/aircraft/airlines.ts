/** An airline this site can paint an aircraft for. */
export interface Airline {
  /** Two-character IATA designator, the start of a flight number: CA in CA818. */
  iata: string
  /** Three-letter ICAO designator, used by air traffic control: CCA in CCA818. */
  icao: string
  name: string
  /** Other names people write for the same airline, in any language. */
  aliases: readonly string[]
}

export const AIRLINES: readonly Airline[] = [
  { iata: "CA", icao: "CCA", name: "Air China", aliases: ["中国国际航空", "中国国航", "国航"] },
  { iata: "MU", icao: "CES", name: "China Eastern Airlines", aliases: ["中国东方航空", "东方航空", "东航"] },
  { iata: "CZ", icao: "CSN", name: "China Southern Airlines", aliases: ["中国南方航空", "南方航空", "南航"] },
  { iata: "HU", icao: "CHH", name: "Hainan Airlines", aliases: ["海南航空", "海航"] },
  { iata: "3U", icao: "CSC", name: "Sichuan Airlines", aliases: ["四川航空", "川航"] },
  { iata: "MF", icao: "CXA", name: "Xiamen Airlines", aliases: ["XiamenAir", "厦门航空", "厦航"] },
  { iata: "UA", icao: "UAL", name: "United Airlines", aliases: ["美国联合航空", "联合航空", "美联航"] },
  { iata: "DL", icao: "DAL", name: "Delta Air Lines", aliases: ["达美航空"] },
  { iata: "AA", icao: "AAL", name: "American Airlines", aliases: ["美国航空", "美航"] },
  { iata: "CX", icao: "CPA", name: "Cathay Pacific", aliases: ["Cathay", "国泰航空"] },
  { iata: "NH", icao: "ANA", name: "All Nippon Airways", aliases: ["ANA", "全日空", "全日本空输"] },
  { iata: "JL", icao: "JAL", name: "Japan Airlines", aliases: ["JAL", "日本航空", "日航"] },
  { iata: "KE", icao: "KAL", name: "Korean Air", aliases: ["Korean", "大韩航空"] },
  { iata: "SQ", icao: "SIA", name: "Singapore Airlines", aliases: ["新加坡航空", "新航"] },
]

/**
 * Reduces an airline name to what tells airlines apart: lower case, no spaces or
 * punctuation, and without a closing "Airlines", "Airways" or "航空公司". This way
 * "Delta", "delta air lines" and "Delta Airlines" are the same name.
 */
function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]/g, "")
    .replace(/(airlines?|airways|航空公司|航空)$/, "")
}

const BY_DESIGNATOR = new Map<string, Airline>()
const BY_NAME = new Map<string, Airline>()
for (const airline of AIRLINES) {
  BY_DESIGNATOR.set(airline.iata, airline)
  BY_DESIGNATOR.set(airline.icao, airline)
  for (const name of [airline.name, ...airline.aliases]) {
    BY_NAME.set(nameKey(name), airline)
  }
}

/**
 * The airline part of a flight number: "CA" in "CA818". A flight number that starts with
 * three letters carries an ICAO designator instead: "CCA" in "CCA818". IATA designators
 * may contain a digit ("9C8887", "3U8888"), so the first two characters are taken as
 * they are.
 */
export function airlineDesignator(flightNo: string | null | undefined): string | null {
  const code = (flightNo ?? "").replaceAll(" ", "").toUpperCase()
  if (/^[A-Z]{3}\d/.test(code)) return code.slice(0, 3)
  return code.length >= 2 ? code.slice(0, 2) : null
}

/**
 * The airline of a flight. The flight number decides; the name typed into the airline
 * field is only consulted when there is no flight number or its designator is unknown.
 */
export function airlineOf(flightNo: string | null | undefined, airlineName: string | null | undefined): Airline | null {
  const designator = airlineDesignator(flightNo)
  const byDesignator = designator ? BY_DESIGNATOR.get(designator) : undefined
  if (byDesignator) return byDesignator

  return (airlineName && BY_NAME.get(nameKey(airlineName))) || null
}
