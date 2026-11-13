import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "@/i18n/locales/en"
import zh from "@/i18n/locales/zh"

/**
 * The languages the UI is translated into. `label` is the language's own name for
 * itself and `htmlLang` is what goes into <html lang>.
 */
export const LANGUAGES = [
  { code: "zh", label: "中文", htmlLang: "zh-CN" },
  { code: "en", label: "EN", htmlLang: "en" },
] as const

const FALLBACK_LANGUAGE = "en"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    supportedLngs: LANGUAGES.map((language) => language.code),
    // Regional variants use their base language: "zh-CN" and "zh-TW" both resolve to "zh".
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: FALLBACK_LANGUAGE,
    // The translations are bundled with the app, so there is nothing to wait for.
    // Initialising synchronously means the first render already has its texts.
    initAsync: false,
    interpolation: {
      // React escapes everything it renders; escaping here as well would show "&amp;".
      escapeValue: false,
    },
    detection: {
      // A choice made with the toggle wins; a first-time visitor gets the browser's language.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "flightfootprints.language",
    },
  })

/** Keeps <html lang> correct, which screen readers and the browser's font choice rely on. */
function syncDocumentLanguage() {
  const current = LANGUAGES.find((language) => language.code === i18n.resolvedLanguage)
  document.documentElement.lang = current?.htmlLang ?? FALLBACK_LANGUAGE
}

i18n.on("languageChanged", syncDocumentLanguage)
syncDocumentLanguage()

export default i18n
