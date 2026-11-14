import { useMemo } from "react"
import { useTranslation } from "react-i18next"

/**
 * Turns "2024-05-01" into a Date at local midnight. `new Date("2024-05-01")` would mean
 * midnight UTC instead, which is still the previous day anywhere west of Greenwich.
 */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Dates, numbers and country names written the way the selected language expects. */
export function useFormatters() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? "en"

  return useMemo(() => {
    const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: "long" })
    const numberFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 0 })
    const oneDecimalFormat = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    const regionNames = new Intl.DisplayNames([language], { type: "region" })
    return {
      /** "2024-05-01" becomes "May 1, 2024" or "2024年5月1日". */
      date: (iso: string) => dateFormat.format(parseIsoDate(iso)),
      /** A whole number with thousands separators: 187,654. */
      number: (value: number) => numberFormat.format(value),
      /** One digit after the decimal point: 4.7. */
      oneDecimal: (value: number) => oneDecimalFormat.format(value),
      /** ISO 3166 code to country name: "CN" becomes "China" or "中国". */
      country: (code: string) => regionNames.of(code) ?? code,
    }
  }, [language])
}

/** Today's date plus `days`, as "YYYY-MM-DD" in the visitor's own time zone. */
export function isoDateFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
