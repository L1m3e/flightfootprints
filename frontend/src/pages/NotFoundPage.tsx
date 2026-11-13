import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFound.body")}</p>
      {/* A link that looks like a button: navigation should stay a real <a>. */}
      <Link to="/" className={buttonVariants({ variant: "outline", className: "mt-3" })}>
        <ArrowLeft aria-hidden="true" />
        {t("notFound.back")}
      </Link>
    </div>
  )
}
