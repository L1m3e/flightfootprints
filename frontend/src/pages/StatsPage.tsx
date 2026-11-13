import { useTranslation } from "react-i18next"

import { PagePlaceholder } from "@/components/PagePlaceholder"

export function StatsPage() {
  const { t } = useTranslation()
  return <PagePlaceholder title={t("stats.title")} />
}
