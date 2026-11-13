import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { useSession, useSignOut } from "@/features/auth/api"

/** Header corner: a sign-in link for visitors, the name and a sign-out button otherwise. */
export function UserMenu() {
  const { t } = useTranslation()
  const { session, isAdmin } = useSession()
  const signOut = useSignOut()

  // Until the session is known, show nothing instead of flashing the wrong state.
  if (!session) return null

  if (!session.authenticated) {
    return (
      <Link to="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
        {t("auth.signIn")}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Hidden on a phone to keep the header on two rows; the sign-out button says who is signed in. */}
      <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">{session.username}</span>
      {isAdmin && <Badge variant="secondary">{t("auth.admin")}</Badge>}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${t("auth.signOut")} (${session.username})`}
        title={`${t("auth.signOut")} (${session.username})`}
        disabled={signOut.isPending}
        onClick={() =>
          signOut.mutate(undefined, {
            onSuccess: () => toast.success(t("auth.signedOut")),
            onError: () => toast.error(t("errors.generic")),
          })
        }
      >
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  )
}
