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

  // The result is awaited here rather than handled in callbacks passed to mutate():
  // deleting a flight removes its card, and this button with it, and TanStack Query
  // skips those callbacks once the component is gone, so the message would never show.
  async function confirmDelete() {
    try {
      await deleteFlight.mutateAsync(flight.id)
      toast.success(t("flights.deleted"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
    setOpen(false)
  }

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
            onClick={() => void confirmDelete()}
          >
            {t("flights.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
