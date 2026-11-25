import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { LoaderCircle, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { z } from "zod"

import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { AIRCRAFT_TYPES } from "@/features/aircraft/aircraftTypes"
import { airlineDesignator, airlineName, airlineOfFlightNo, findAirline } from "@/features/flights/airlines"
import { AirportCombobox } from "@/features/flights/AirportCombobox"
import { airlinesQuery, CABINS, type Airline, type Airport, type Flight, type FlightInput } from "@/features/flights/api"
import { FLIGHT_NO_PATTERN, normalizeFlightNo } from "@/features/flights/flightNumber"
import { useFlightLookup } from "@/features/flights/useFlightLookup"
import { ApiError, type FieldProblem } from "@/lib/api"
import { isoDateFromToday } from "@/lib/format"
import { useErrorMessage } from "@/lib/useErrorMessage"

// One empty list for "not loaded yet", so that it is the same value on every render.
const NO_AIRLINES: Airline[] = []

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

function toFormValues(flight: Flight | undefined, language: string): FormValues {
  return {
    flightDate: flight?.flightDate ?? "",
    flightNo: flight?.flightNo ?? "",
    // The field holds a name, in the language of the page. What is sent is decided on saving.
    airline: flight ? airlineName(flight.airline, language) : "",
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

function toInput(values: ValidValues, airlines: readonly Airline[]): FlightInput {
  return {
    flightDate: values.flightDate,
    flightNo: emptyToNull(normalizeFlightNo(values.flightNo)),
    // A known airline is sent as its code, any other as the name that was typed. Should
    // the list of airlines not have arrived yet, the name is sent and the backend looks it up.
    airline: findAirline(airlines, values.airline)?.iata ?? values.airline.trim(),
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
    case "OutOfRange":
      return t("validation.lookupDateRange")
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
  const { t, i18n } = useTranslation()
  const errorMessage = useErrorMessage()
  // One day of slack, like the backend: "today" depends on where the visitor is.
  const latestDate = isoDateFromToday(1)
  const schema = useMemo(() => createSchema(t, latestDate), [t, latestDate])

  // Three type arguments: the field values, an unused context, and the validated result.
  // Read once: the form takes its starting values when it is created.
  const [initialValues] = useState(() => toFormValues(flight, i18n.language))
  const form = useForm<FormValues, unknown, ValidValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  })
  const { errors, isSubmitting } = form.formState

  // The start of a flight number names the airline ("CA" in CA818), so the airline field
  // can be filled in from it. What was filled in is remembered: the form may replace its
  // own suggestion when the flight number or the language changes, but never something
  // the user typed. A flight that is being edited starts out as "filled in" only if its
  // airline is the one its flight number names; otherwise the airline was typed on
  // purpose (a flight operated by another airline) and must stay.
  const { data: airlines = NO_AIRLINES } = useQuery(airlinesQuery)
  const flightNo = useWatch({ control: form.control, name: "flightNo" })
  const flightDate = useWatch({ control: form.control, name: "flightDate" })
  const fromAirport = useWatch({ control: form.control, name: "from" })
  const toAirport = useWatch({ control: form.control, name: "to" })
  const filledIn = useRef<string | null>(
    flight?.airline.iata != null && flight.airline.iata === airlineDesignator(flight.flightNo)
      ? initialValues.airline
      : null,
  )
  useEffect(() => {
    const airline = airlineOfFlightNo(airlines, flightNo)
    if (!airline) return

    const name = airlineName(airline, i18n.language)
    const current = form.getValues("airline")
    if (current === name) return
    if (current.trim() !== "" && current !== filledIn.current) return

    filledIn.current = name
    form.setValue("airline", name, { shouldDirty: true, shouldValidate: true })
  }, [airlines, flightNo, form, i18n.language])

  // Says what the typed airline was understood as, before anything is saved.
  const typedAirline = useWatch({ control: form.control, name: "airline" })
  const knownAirline = findAirline(airlines, typedAirline)
  let airlineHint = t("flights.airlineHint")
  if (knownAirline) {
    airlineHint = t("flights.airlineKnown", {
      code: knownAirline.iata,
      name: [knownAirline.name, knownAirline.nameZh].filter(Boolean).join(" · "),
    })
  } else if (typedAirline.trim() !== "" && airlines.length > 0) {
    airlineHint = t("flights.airlineUnknown")
  }

  // Looking a flight up fills in the route and the aircraft, which would otherwise be
  // typed by hand. The hook asks the backend; the form decides what to do with the
  // answer, and never replaces a value the user typed.
  const filledAircraft = useRef<string | null>(null)
  const lookup = useFlightLookup({
    flightNo,
    flightDate,
    from: fromAirport?.iata,
    to: toAirport?.iata,
    language: i18n.language,
    t,
    onFill: (fill) => {
      form.setValue("from", fill.from, { shouldDirty: true, shouldValidate: true })
      form.setValue("to", fill.to, { shouldDirty: true, shouldValidate: true })

      if (fill.aircraft) {
        const current = form.getValues("aircraft")
        if (current.trim() === "" || current === filledAircraft.current) {
          filledAircraft.current = fill.aircraft
          form.setValue("aircraft", fill.aircraft, { shouldDirty: true, shouldValidate: true })
        }
      }

      if (fill.airline) {
        const current = form.getValues("airline")
        if (current.trim() === "" || current === filledIn.current) {
          filledIn.current = fill.airline
          form.setValue("airline", fill.airline, { shouldDirty: true, shouldValidate: true })
        }
      }
    },
    onInvalidFlightNo: () => form.setError("flightNo", { message: t("validation.flightNoFormat") }),
    describeProblem: (problem) => translateProblem(problem, t),
  })

  async function submit(values: ValidValues) {
    try {
      await onSubmit(toInput(values, airlines))
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
            <InputGroup>
              <InputGroupInput
                id="flightNo"
                placeholder="MU587"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono uppercase placeholder:normal-case"
                aria-invalid={!!errors.flightNo}
                {...form.register("flightNo")}
              />
              {/* Asks the lookup service which route the number flies. The result fills in
                  the airports and the aircraft; the form never saves anything by itself. */}
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => void lookup.lookUp()}
                  disabled={lookup.lookingUp || normalizeFlightNo(flightNo) === ""}
                  aria-label={t("flights.lookup")}
                  title={t("flights.lookup")}
                >
                  {lookup.lookingUp ? <LoaderCircle className="animate-spin" /> : <Search />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>{t("flights.flightNoHint")}</FieldDescription>
            <FieldError errors={[errors.flightNo]} />
            {lookup.message && (
              <p
                className={`text-sm ${lookup.message.kind === "error" ? "text-destructive" : "text-muted-foreground"}`}
                role={lookup.message.kind === "error" ? "alert" : "status"}
              >
                {lookup.message.text}
              </p>
            )}
            {lookup.choices.length > 1 && (
              <div className="flex flex-col gap-2">
                <FieldDescription>{t("flights.lookupChoose")}</FieldDescription>
                <div className="flex flex-wrap gap-2">
                  {lookup.choices.map((route) => (
                    <Button
                      key={`${route.from.iata}-${route.to.iata}-${route.aircraftIcao ?? ""}-${route.aircraftModel ?? ""}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lookup.choose(route)}
                    >
                      <span className="font-mono">
                        {route.from.iata} → {route.to.iata}
                      </span>
                      {(route.aircraftModel ?? route.aircraftIcao) && (
                        <span className="text-muted-foreground">{route.aircraftModel ?? route.aircraftIcao}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Field>
        </div>

        <Field data-invalid={!!errors.airline}>
          <FieldLabel htmlFor="airline">{t("flights.airline")}</FieldLabel>
          {/* Any name is accepted. The list offers the airlines the site knows, and the
              line under the field says whether what was typed is one of them. */}
          <Input
            id="airline"
            list="airline-names"
            placeholder={t("flights.airlinePlaceholder")}
            aria-invalid={!!errors.airline}
            aria-describedby="airline-hint"
            {...form.register("airline")}
          />
          <datalist id="airline-names">
            {airlines.map((airline) => (
              <option key={airline.iata} value={airlineName(airline, i18n.language)}>
                {/* The code and the name in the other language, to find it by either. */}
                {airline.iata} · {i18n.language.startsWith("zh") ? airline.name : (airline.nameZh ?? airline.name)}
              </option>
            ))}
          </datalist>
          <FieldDescription id="airline-hint">{airlineHint}</FieldDescription>
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
          {/* Any text is accepted. The list offers common types in one spelling, so that the
              same aircraft is not written three different ways. */}
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
