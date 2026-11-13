import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteFlight, type Flight } from "@/features/flights/api"
import { useFormatters } from "@/lib/format"
import { useErrorMessage } from "@/lib/useErrorMessage"

/** Deleting cannot be undone, so it always asks first and names the flight it is about to remove. */
export function DeleteFlightButton({ flight }: { flight: Flight }) {
  const { t } = useTranslation()
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const deleteFlight = useDeleteFlight()
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Trash2 aria-hidden="true" />
        {t("flights.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("flights.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("flights.deleteBody", {
              route: `${flight.from.iata} → ${flight.to.iata}`,
              date: format.date(flight.flightDate),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("flights.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteFlight.isPending}
            onClick={() =>
              deleteFlight.mutate(flight.id, {
                onSuccess: () => {
                  setOpen(false)
                  toast.success(t("flights.deleted"))
                },
                onError: (error) => {
                  setOpen(false)
                  toast.error(errorMessage(error))
                },
              })
            }
          >
            {t("flights.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
