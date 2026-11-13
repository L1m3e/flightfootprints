import { cn } from "cn"
import { useTranslation } from "react-i18next"

import { LANGUAGES } from "@/i18n"

/**
 * Two-way switch between Chinese and English. Each option is written in its own
 * language, so a visitor can find theirs whatever the page currently shows.
 */
export function LanguageToggle() {
  const { t, i18n } = useTranslation()

  return (
    <fieldset className="inline-flex rounded-lg border bg-card p-0.5">
      <legend className="sr-only">{t("language.label")}</legend>
      {LANGUAGES.map(({ code, label, htmlLang }) => {
        const active = i18n.resolvedLanguage === code
        return (
          <button
            key={code}
            type="button"
            lang={htmlLang}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(code)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        )
      })}
    </fieldset>
  )
}
