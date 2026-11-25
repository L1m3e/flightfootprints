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
import { useDeleteContributor, type Contributor } from "@/features/contributors/api"
import { ApiError } from "@/lib/api"
import { useErrorMessage } from "@/lib/useErrorMessage"

/** Removing cannot be undone, so it asks first and names who is about to be removed. */
export function DeleteContributorButton({ contributor }: { contributor: Contributor }) {
  const { t } = useTranslation()
  const errorMessage = useErrorMessage()
  const deleteContributor = useDeleteContributor()
  const [open, setOpen] = useState(false)

  // Awaited here rather than handled in callbacks passed to mutate(): removing the entry
  // removes this button with it, and TanStack Query skips those callbacks once the
  // component is gone, so the message would never show.
  async function confirmDelete() {
    try {
      await deleteContributor.mutateAsync(contributor.id)
      toast.success(t("contributors.deleted", { name: contributor.name }))
    } catch (error) {
      const gone = error instanceof ApiError && error.status === 404
      toast.error(gone ? t("contributors.notFound") : errorMessage(error))
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
          <AlertDialogTitle>{t("contributors.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("contributors.deleteBody", { name: contributor.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("flights.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteContributor.isPending}
            onClick={() => void confirmDelete()}
          >
            {t("flights.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
