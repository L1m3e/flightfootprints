import { MapPinned } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

/** Link to the map page with this flight selected. */
export function ViewOnMapLink({ flightId }: { flightId: number }) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/map?flight=${flightId}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2 hover:text-foreground"
    >
      <MapPinned className="size-4" aria-hidden="true" />
      {t("flights.viewOnMap")}
    </Link>
  )
}
