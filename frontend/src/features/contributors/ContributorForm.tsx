import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Contributor, ContributorInput } from "@/features/contributors/api"
import { linkFrom } from "@/features/contributors/link"
import { ApiError } from "@/lib/api"
import { useErrorMessage } from "@/lib/useErrorMessage"

const FIELDS = ["name", "link", "note"] as const

/**
 * The three fields of a contributor, for adding one and for changing one. The checks
 * mirror the backend's, which stays the authority; these give instant feedback.
 */
export function ContributorForm({
  contributor,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  /** The entry being changed; leave out to add a new one. */
  contributor?: Contributor
  submitLabel: string
  /** Saves the entry. If it rejects, the form shows why and keeps what was typed. */
  onSubmit: (input: ContributorInput) => Promise<void>
  onCancel?: () => void
}) {
  const { t } = useTranslation()
  const errorMessage = useErrorMessage()
  // Two forms can be on the page at once (adding, and changing an entry), so the ids of
  // the fields carry the entry they belong to.
  const idPrefix = contributor ? `contributor-${contributor.id}` : "contributor-new"

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("validation.required"))
          .max(60, t("validation.tooLong", { max: 60 })),
        link: z
          .string()
          .refine((value) => linkFrom(value) !== undefined, t("contributors.linkInvalid"))
          // Counted as it will be saved, with the "https://" the form may add.
          .refine((value) => (linkFrom(value) ?? "").length <= 200, t("validation.tooLong", { max: 200 })),
        note: z
          .string()
          .trim()
          .max(200, t("validation.tooLong", { max: 200 })),
      }),
    [t],
  )
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contributor?.name ?? "",
      link: contributor?.link ?? "",
      note: contributor?.note ?? "",
    },
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: Values) {
    try {
      await onSubmit({
        name: values.name,
        link: linkFrom(values.link) ?? null,
        note: values.note === "" ? null : values.note,
      })
      // A form for adding is used again for the next name.
      if (!contributor) form.reset()
    } catch (error) {
      const problems = error instanceof ApiError ? error.fieldProblems : []
      let shownAtField = false
      for (const problem of problems) {
        const field = FIELDS.find((name) => name === problem.field)
        if (field) {
          form.setError(field, {
            message: field === "link" && problem.code === "Pattern" ? t("contributors.linkInvalid") : problem.message,
          })
          shownAtField = true
        }
      }
      if (!shownAtField) {
        const gone = error instanceof ApiError && error.status === 404
        form.setError("root", { message: gone ? t("contributors.notFound") : errorMessage(error) })
      }
    }
  }

  const optional = <span className="font-normal text-muted-foreground">({t("flights.optional")})</span>

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <FieldGroup>
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor={`${idPrefix}-name`}>{t("contributors.name")}</FieldLabel>
            <Input id={`${idPrefix}-name`} aria-invalid={!!errors.name} {...form.register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.link}>
            <FieldLabel htmlFor={`${idPrefix}-link`}>
              {t("contributors.link")} {optional}
            </FieldLabel>
            <Input
              id={`${idPrefix}-link`}
              type="url"
              inputMode="url"
              placeholder="https://github.com/…"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!errors.link}
              aria-describedby={`${idPrefix}-link-hint`}
              {...form.register("link")}
            />
            <FieldDescription id={`${idPrefix}-link-hint`}>{t("contributors.linkHint")}</FieldDescription>
            <FieldError errors={[errors.link]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.note}>
          <FieldLabel htmlFor={`${idPrefix}-note`}>
            {t("contributors.note")} {optional}
          </FieldLabel>
          <Input
            id={`${idPrefix}-note`}
            placeholder={t("contributors.notePlaceholder")}
            aria-invalid={!!errors.note}
            {...form.register("note")}
          />
          <FieldError errors={[errors.note]} />
        </Field>

        <FieldError errors={[errors.root]} />

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("flights.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
