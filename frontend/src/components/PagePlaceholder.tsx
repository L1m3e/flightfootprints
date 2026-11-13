import { Construction } from "lucide-react"
import { useTranslation } from "react-i18next"

/** Stand-in for a page that has a route and a nav entry but no content yet. */
export function PagePlaceholder({ title }: { title: string }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <Construction className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t("placeholder.body")}</p>
      </div>
    </div>
  )
}
