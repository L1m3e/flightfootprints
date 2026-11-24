import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { cityName, placeName, type Place } from "@/features/flights/places"

/** City and place names in the language the page is shown in. */
export function usePlaceNames() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? "en"

  return useMemo(
    () => ({
      /** The city an airport serves, or null when it has none. */
      city: (airport: Place) => cityName(airport, language),
      /** "Shanghai (Pudong), China"; just "Hong Kong" where city and region are one name. */
      place: (airport: Place, fallback?: string) => placeName(airport, language, fallback),
    }),
    [language],
  )
}
