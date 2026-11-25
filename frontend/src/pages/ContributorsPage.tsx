import { useQuery } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ExternalLink } from "@/components/ExternalLink"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/api"
import {
  contributorsQuery,
  useAddContributor,
  useUpdateContributor,
  type Contributor,
  type ContributorInput,
} from "@/features/contributors/api"
import { ContributorForm } from "@/features/contributors/ContributorForm"
import { DeleteContributorButton } from "@/features/contributors/DeleteContributorButton"
import { linkLabel } from "@/features/contributors/link"

/**
 * The people who helped build the site. Everyone can read the list; an administrator
 * also gets the buttons to change it and a form to add a name.
 */
export function ContributorsPage() {
  const { t } = useTranslation()
  const { isAdmin } = useSession()
  const { data: contributors, isPending, isError, refetch } = useQuery(contributorsQuery)
  const addContributor = useAddContributor()

  async function add(input: ContributorInput) {
    await addContributor.mutateAsync(input)
    toast.success(t("contributors.added", { name: input.name }))
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("contributors.title")}</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">{t("contributors.subtitle")}</p>
      </section>

      {isPending ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("errors.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t("errors.retry")}
          </Button>
        </div>
      ) : contributors.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {t(isAdmin ? "contributors.emptyAdmin" : "contributors.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {contributors.map((contributor) => (
            <ContributorRow key={contributor.id} contributor={contributor} canEdit={isAdmin} />
          ))}
        </ul>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("contributors.addTitle")}</h2>
            </CardTitle>
            <CardDescription>{t("contributors.addHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ContributorForm submitLabel={t("contributors.add")} onSubmit={add} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/** One entry of the list. For an administrator it can turn into the form that changes it. */
function ContributorRow({ contributor, canEdit }: { contributor: Contributor; canEdit: boolean }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const updateContributor = useUpdateContributor(contributor.id)

  async function save(input: ContributorInput) {
    await updateContributor.mutateAsync(input)
    toast.success(t("contributors.updated", { name: input.name }))
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <ContributorForm
          contributor={contributor}
          submitLabel={t("flights.save")}
          onSubmit={save}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:px-5">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-medium">{contributor.name}</span>
          {contributor.link && (
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              <ExternalLink href={contributor.link}>{linkLabel(contributor.link)}</ExternalLink>
            </span>
          )}
        </p>
        {contributor.note && <p className="mt-1 text-sm text-muted-foreground">{contributor.note}</p>}
      </div>
      {canEdit && (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" />
            {t("flights.edit")}
          </Button>
          <DeleteContributorButton contributor={contributor} />
        </div>
      )}
    </li>
  )
}
