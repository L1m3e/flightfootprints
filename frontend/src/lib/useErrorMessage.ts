import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { ApiError } from "@/lib/api"

/** Turns a failed request into one sentence for a toast, in the selected language. */
export function useErrorMessage() {
  const { t } = useTranslation()

  return useCallback(
    (error: unknown): string => {
      if (error instanceof ApiError) {
        if (error.status === 401) return t("errors.sessionExpired")
        if (error.status === 403) return t("errors.notAllowed")
        if (error.status === 404) return t("flights.notFound")
      }
      return t("errors.generic")
    },
    [t],
  )
}
