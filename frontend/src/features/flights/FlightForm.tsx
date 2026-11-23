import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { z } from "zod"

import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { AIRCRAFT_TYPES } from "@/features/aircraft/aircraftTypes"
import { AirportCombobox } from "@/features/flights/AirportCombobox"
import { CABINS, type Airport, type Flight, type FlightInput } from "@/features/flights/api"
import { ApiError, type FieldProblem } from "@/lib/api"
import { isoDateFromToday } from "@/lib/format"
import { useErrorMessage } from "@/lib/useErrorMessage"

// Same rule as the backend: airline designator, up to four digits, optional letter.
const FLIGHT_NO_PATTERN = /^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/

function normalizeFlightNo(value: string): string {
  return value.replaceAll(" ", "").toUpperCase()
}

/** The checks here mirror the backend's, which stays the authority. These give instant feedback. */
function createSchema(t: TFunction, latestDate: string) {
  const airport = z.custom<Airport | null>().refine((value) => value != null, t("validation.chooseAirport"))

  return z
    .object({
      flightDate: z
        .string()
        .min(1, t("validation.required"))
        // "YYYY-MM-DD" strings sort like dates, so plain comparison works.
        .refine((value) => value === "" || value <= latestDate, t("validation.futureDate")),
      flightNo: z.string().refine((value) => {
        const normalized = normalizeFlightNo(value)
        return normalized === "" || FLIGHT_NO_PATTERN.test(normalized)
      }, t("validation.flightNoFormat")),
      airline: z
        .string()
        .trim()
        .min(1, t("validation.required"))
        .max(60, t("validation.tooLong", { max: 60 })),
      from: airport,
      to: airport,
      aircraft: z.string().max(60, t("validation.tooLong", { max: 60 })),
      seat: z.string().max(5, t("validation.tooLong", { max: 5 })),
      cabin: z.enum(["", ...CABINS]),
      notes: z.string().max(2000, t("validation.tooLong", { max: 2000 })),
    })
    .refine((values) => !values.from || !values.to || values.from.iata !== values.to.iata, {
      path: ["to"],
      message: t("validation.sameAirport"),
    })
}

type Schema = ReturnType<typeof createSchema>
/** What the fields hold while the visitor is typing: the airports may still be empty. */
type FormValues = z.input<Schema>
/** What comes out once every check has passed: both airports are known to be chosen. */
type ValidValues = z.output<Schema>

function toFormValues(flight: Flight | undefined): FormValues {
  return {
    flightDate: flight?.flightDate ?? "",
    flightNo: flight?.flightNo ?? "",
    airline: flight?.airline ?? "",
    from: flight?.from ?? null,
    to: flight?.to ?? null,
    aircraft: flight?.aircraft ?? "",
    seat: flight?.seat ?? "",
    cabin: flight?.cabin ?? "",
    notes: flight?.notes ?? "",
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function toInput(values: ValidValues): FlightInput {
  return {
    flightDate: values.flightDate,
    flightNo: emptyToNull(normalizeFlightNo(values.flightNo)),
    airline: values.airline.trim(),
    fromIata: values.from.iata,
    toIata: values.to.iata,
    aircraft: emptyToNull(values.aircraft),
    seat: emptyToNull(values.seat.toUpperCase()),
    cabin: values.cabin === "" ? null : values.cabin,
    notes: emptyToNull(values.notes),
  }
}

/** Where a backend field error is shown: the API speaks of fromIata, the form of from. */
const FORM_FIELD: Record<string, keyof FormValues> = {
  flightDate: "flightDate",
  flightNo: "flightNo",
  airline: "airline",
  fromIata: "from",
  toIata: "to",
  aircraft: "aircraft",
  seat: "seat",
  cabin: "cabin",
  notes: "notes",
}

function translateProblem(problem: FieldProblem, t: TFunction): string {
  switch (problem.code) {
    case "UnknownAirport":
      return t("validation.unknownAirport")
    case "SameAirport":
      return t("validation.sameAirport")
    case "InFuture":
      return t("validation.futureDate")
    case "NotNull":
    case "NotBlank":
      return t("validation.required")
    case "Pattern":
      return problem.field === "flightNo" ? t("validation.flightNoFormat") : problem.message
    default:
      return problem.message
  }
}

export function FlightForm({
  flight,
  onSubmit,
}: {
  /** The flight being edited; leave out to add a new one. */
  flight?: Flight
  /** Saves the flight. If it rejects, the form shows why and stays open. */
  onSubmit: (input: FlightInput) => Promise<void>
}) {
  const { t } = useTranslation()
  const errorMessage = useErrorMessage()
  // One day of slack, like the backend: "today" depends on where the visitor is.
  const latestDate = isoDateFromToday(1)
  const schema = useMemo(() => createSchema(t, latestDate), [t, latestDate])

  // Three type arguments: the field values, an unused context, and the validated result.
  const form = useForm<FormValues, unknown, ValidValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(flight),
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: ValidValues) {
    try {
      await onSubmit(toInput(values))
    } catch (error) {
      const problems = error instanceof ApiError ? error.fieldProblems : []
      let shownAtField = false
      for (const problem of problems) {
        const field = FORM_FIELD[problem.field]
        if (field) {
          form.setError(field, { message: translateProblem(problem, t) })
          shownAtField = true
        }
      }
      // Anything that is not about one field (session expired, server down, ...) goes above the buttons.
      if (!shownAtField) {
        form.setError("root", { message: errorMessage(error) })
      }
    }
  }

  const optional = <span className="font-normal text-muted-foreground">({t("flights.optional")})</span>

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <FieldGroup>
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.flightDate}>
            <FieldLabel htmlFor="flightDate">{t("flights.date")}</FieldLabel>
            <Input
              id="flightDate"
              type="date"
              max={latestDate}
              aria-invalid={!!errors.flightDate}
              {...form.register("flightDate")}
            />
            <FieldError errors={[errors.flightDate]} />
          </Field>

          <Field data-invalid={!!errors.flightNo}>
            <FieldLabel htmlFor="flightNo">
              {t("flights.flightNo")} {optional}
            </FieldLabel>
            <Input
              id="flightNo"
              placeholder="MU587"
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono uppercase placeholder:normal-case"
              aria-invalid={!!errors.flightNo}
              {...form.register("flightNo")}
            />
            <FieldError errors={[errors.flightNo]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.airline}>
          <FieldLabel htmlFor="airline">{t("flights.airline")}</FieldLabel>
          <Input
            id="airline"
            placeholder={t("flights.airlinePlaceholder")}
            aria-invalid={!!errors.airline}
            {...form.register("airline")}
          />
          <FieldError errors={[errors.airline]} />
        </Field>

        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.from}>
            <FieldLabel htmlFor="from">{t("flights.from")}</FieldLabel>
            <Controller
              control={form.control}
              name="from"
              render={({ field }) => (
                <AirportCombobox
                  id="from"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.from}
                />
              )}
            />
            <FieldError errors={[errors.from]} />
          </Field>

          <Field data-invalid={!!errors.to}>
            <FieldLabel htmlFor="to">{t("flights.to")}</FieldLabel>
            <Controller
              control={form.control}
              name="to"
              render={({ field }) => (
                <AirportCombobox
                  id="to"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.to}
                />
              )}
            />
            <FieldError errors={[errors.to]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.aircraft}>
          <FieldLabel htmlFor="aircraft">
            {t("flights.aircraft")} {optional}
          </FieldLabel>
          {/* Any text is accepted. The list only offers the spellings the site is sure to
              recognise, so that it can show a drawing of the aircraft. */}
          <Input
            id="aircraft"
            list="aircraft-types"
            placeholder={t("flights.aircraftPlaceholder")}
            aria-invalid={!!errors.aircraft}
            {...form.register("aircraft")}
          />
          <datalist id="aircraft-types">
            {Object.values(AIRCRAFT_TYPES).map((type) => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </datalist>
          <FieldError errors={[errors.aircraft]} />
        </Field>

        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="cabin">
              {t("flights.cabin")} {optional}
            </FieldLabel>
            <NativeSelect id="cabin" className="w-full" {...form.register("cabin")}>
              <NativeSelectOption value="">{t("flights.cabinNone")}</NativeSelectOption>
              {CABINS.map((cabin) => (
                <NativeSelectOption key={cabin} value={cabin}>
                  {t(`flights.cabins.${cabin}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field data-invalid={!!errors.seat}>
            <FieldLabel htmlFor="seat">
              {t("flights.seat")} {optional}
            </FieldLabel>
            <Input
              id="seat"
              placeholder={t("flights.seatPlaceholder")}
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono uppercase placeholder:normal-case"
              aria-invalid={!!errors.seat}
              {...form.register("seat")}
            />
            <FieldError errors={[errors.seat]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="notes">
            {t("flights.notes")} {optional}
          </FieldLabel>
          <Textarea id="notes" rows={3} aria-invalid={!!errors.notes} {...form.register("notes")} />
          <FieldDescription className="sr-only">{t("validation.tooLong", { max: 2000 })}</FieldDescription>
          <FieldError errors={[errors.notes]} />
        </Field>

        <FieldError errors={[errors.root]} />

        <div className="flex items-center justify-end gap-2">
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            {t("flights.cancel")}
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {t("flights.save")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
