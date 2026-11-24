import { cn } from "cn"
import { Trans, useTranslation } from "react-i18next"

import { ExternalLink } from "@/components/ExternalLink"

const CHANGELOG_URL = "https://github.com/L1m3e/flightfootprints/blob/main/CHANGELOG.md"

export function SiteFooter({ wide = false }: { wide?: boolean }) {
  const { t } = useTranslation()

  return (
    <footer className="border-t">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6",
          wide ? "max-w-7xl" : "max-w-5xl",
        )}
      >
        <p>{t("footer.tagline")}</p>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span>
            {/* <Trans> puts the text between <source> and </source> inside the link. */}
            <Trans
              i18nKey="footer.airportData"
              components={{ source: <ExternalLink href="https://ourairports.com/data/" /> }}
            />
          </span>
          {/* Which version is running, in the corner of every page. It leads to the list
              of what each version changed. */}
          <a
            href={CHANGELOG_URL}
            target="_blank"
            rel="noreferrer"
            title={t("footer.changelog")}
            className="font-mono tabular-nums hover:text-foreground"
          >
            <span className="sr-only">{t("footer.version")} </span>v{__APP_VERSION__}
          </a>
        </p>
      </div>
    </footer>
  )
}
