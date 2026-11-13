import { PlaneTakeoff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SystemStatusCard } from "@/features/health/SystemStatusCard"

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.title")}</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">{t("home.subtitle")}</p>
      </section>

      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <PlaneTakeoff className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-medium">{t("home.emptyTitle")}</h2>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">{t("home.emptyBody")}</p>
      </section>

      <SystemStatusCard />
    </div>
  )
}
