import "i18next"

import type en from "@/i18n/locales/en"

// Tells i18next which keys exist, so t("nav.timline") is a compile error instead of
// a missing text at runtime. English is the reference: zh.ts must have the same shape.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: {
      translation: typeof en
    }
  }
}
