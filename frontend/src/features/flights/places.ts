import type { Airport } from "@/features/flights/api"

/** What is needed of an airport to say where it is. */
export type Place = Pick<Airport, "city" | "cityZh" | "country">

const isChinese = (language: string) => language.startsWith("zh")

/**
 * Regions that are best called by their short name. The full one is "Hong Kong SAR China"
 * (and browsers disagree on whether to use it), which nobody says after a city name.
 */
const KNOWN_BY_SHORT_NAME = new Set(["HK", "MO"])

/** Creating these is slow compared to using them, so there is one pair per language. */
const regionNames = new Map<string, { long: Intl.DisplayNames; short: Intl.DisplayNames }>()

/** Both ways a language names a country or region: the full name and the short one. */
function countryNames(code: string, language: string): [long: string, short: string] {
  let names = regionNames.get(language)
  if (!names) {
    names = {
      long: new Intl.DisplayNames([language], { type: "region" }),
      short: new Intl.DisplayNames([language], { type: "region", style: "short" }),
    }
    regionNames.set(language, names)
  }
  const long = names.long.of(code) ?? code
  return [long, names.short.of(code) ?? long]
}

/** ISO 3166 code to the name of the country or region: "CN" becomes "China" or "中国". */
export function countryName(code: string, language: string): string {
  const [long, short] = countryNames(code, language)
  return KNOWN_BY_SHORT_NAME.has(code) ? short : long
}

/**
 * The city an airport serves. On a Chinese page this is the Chinese name where one is
 * known, and the English name otherwise.
 */
export function cityName(airport: Place, language: string): string | null {
  return (isChinese(language) ? airport.cityZh : null) ?? airport.city
}

function isOneOf(name: string, names: string[]): boolean {
  const wanted = name.trim().toLowerCase()
  return names.some((candidate) => candidate.trim().toLowerCase() === wanted)
}

/**
 * City and country, as in "Shanghai (Pudong), China" or "上海，中国".
 *
 * Where the two are the same name, it is said once: "Hong Kong", not "Hong Kong, Hong
 * Kong"; "新加坡", not "新加坡，新加坡".
 *
 * @param fallback what to show in place of the city when the airport has none
 */
export function placeName(airport: Place, language: string, fallback?: string): string {
  const country = countryName(airport.country, language)
  const city = cityName(airport, language) ?? fallback
  if (!city) return country

  if (isOneOf(city, countryNames(airport.country, language))) return city
  // A city without a Chinese name is shown in English on a Chinese page as well. If it is
  // the country's English name, "Luxembourg，卢森堡" would say one thing in two languages.
  if (isOneOf(city, countryNames(airport.country, "en"))) return country

  return city + (isChinese(language) ? "，" : ", ") + country
}
