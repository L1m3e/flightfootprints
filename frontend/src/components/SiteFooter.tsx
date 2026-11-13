import { Trans, useTranslation } from "react-i18next"

import { ExternalLink } from "@/components/ExternalLink"

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t("footer.tagline")}</p>
        <p>
          {/* <Trans> puts the text between <source> and </source> inside the link. */}
          <Trans
            i18nKey="footer.airportData"
            components={{ source: <ExternalLink href="https://ourairports.com/data/" /> }}
          />
        </p>
      </div>
    </footer>
  )
}
