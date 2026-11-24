import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { airlineName } from "@/features/flights/airlines"

/** Returns a function that gives an airline's name in the language the page is shown in. */
export function useAirlineName() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? "en"
  return useCallback((airline: { name: string; nameZh: string | null }) => airlineName(airline, language), [language])
}
