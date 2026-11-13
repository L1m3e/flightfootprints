import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { useSession } from "@/features/auth/api"
import { FlightList } from "@/features/flights/FlightList"
import { SystemStatusCard } from "@/features/health/SystemStatusCard"

export function HomePage() {
  const { t } = useTranslation()
  const { isAdmin } = useSession()

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.title")}</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">{t("home.subtitle")}</p>
        </div>
        {isAdmin && (
          <Link to="/flights/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            {t("flights.add")}
          </Link>
        )}
      </section>

      <FlightList />

      <SystemStatusCard />
    </div>
  )
}
