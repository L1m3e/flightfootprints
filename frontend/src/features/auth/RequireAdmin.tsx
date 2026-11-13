import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/api"

/**
 * Wraps pages that only the administrator should see. This is a convenience for the
 * visitor, not a security measure: the backend rejects the requests of anyone else.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { session, isLoading, isAdmin } = useSession()

  if (isLoading || !session) {
    return <Skeleton className="h-40 w-full" />
  }
  if (!session.authenticated) {
    // Remember where the visitor was going, so signing in can bring them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isAdmin) {
    return <p className="py-20 text-center text-sm text-muted-foreground">{t("auth.adminOnly")}</p>
  }
  return children
}
