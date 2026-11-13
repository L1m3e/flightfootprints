import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { healthQuery } from "@/features/health/api"

/**
 * Shows whether the whole chain works: this page -> /api (Vite proxy in development)
 * -> Spring Boot -> PostgreSQL. The airport count comes from the database.
 */
export function SystemStatusCard() {
  const { t, i18n } = useTranslation()
  const { data, error, isPending, isFetching, refetch } = useQuery(healthQuery)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("status.title")}</CardTitle>
        <CardDescription>{t("status.description")}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={cn(isFetching && "animate-spin")} aria-hidden="true" />
            {t("status.refresh")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t("status.backend")}</dt>
            <dd className="mt-1 font-medium" aria-live="polite">
              {isPending ? (
                <Skeleton className="h-6 w-28" />
              ) : error ? (
                <StatusLine tone="error" label={t("status.unreachable")} />
              ) : (
                <StatusLine tone="ok" label={t("status.connected")} />
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">{t("status.airports")}</dt>
            <dd className="mt-1 font-mono text-lg font-medium tabular-nums">
              {isPending ? (
                <Skeleton className="h-6 w-20" />
              ) : data && !error ? (
                new Intl.NumberFormat(i18n.resolvedLanguage).format(data.airports)
              ) : (
                // After a failed refresh `data` still holds the last good answer.
                // Showing that old number next to "Unreachable" would be misleading.
                "—"
              )}
            </dd>
          </div>
        </dl>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {/* The hint only makes sense on a developer's machine. */}
            {import.meta.env.DEV ? t("status.errorHint") : error.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusLine({ tone, label }: { tone: "ok" | "error"; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn("size-2 rounded-full", tone === "ok" ? "bg-emerald-500" : "bg-destructive")}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
