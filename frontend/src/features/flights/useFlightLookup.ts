import type { TFunction } from "i18next"
import { useEffect, useRef, useState } from "react"

import { FLIGHT_NO_PATTERN, normalizeFlightNo } from "@/features/flights/flightNumber"
import type { FlightLookup } from "@/features/flights/api"
import { fillFromLookup, lookupFlight, type FlightLookupFill } from "@/features/flights/lookup"
import { ApiError, type FieldProblem } from "@/lib/api"

export interface FlightLookupMessage {
  kind: "info" | "error"
  text: string
}

/** The line under the field for a failed request: a missing flight, a bad number, or an outage. */
function failureMessage(
  error: unknown,
  t: TFunction,
  describeProblem: (problem: FieldProblem) => string,
): FlightLookupMessage {
  if (error instanceof ApiError) {
    if (error.status === 404) return { kind: "error", text: t("flights.lookupNotFound") }
    if (error.status === 400 && error.fieldProblems.length > 0) {
      return { kind: "error", text: describeProblem(error.fieldProblems[0]) }
    }
    if (error.status === 401 || error.status === 403) {
      return { kind: "error", text: t(error.status === 401 ? "errors.sessionExpired" : "errors.notAllowed") }
    }
  }
  return { kind: "error", text: t("flights.lookupFailed") }
}

/**
 * The state behind the lookup button: whether a request is running, the routes to choose
 * between, and the line under the field that says what happened. The form owns the fields
 * and decides what to do with a result through {@code onFill}; this hook only asks the
 * backend and keeps the answer until the number changes.
 */
export function useFlightLookup({
  flightNo,
  flightDate,
  from,
  to,
  language,
  t,
  onFill,
  onInvalidFlightNo,
  describeProblem,
}: {
  flightNo: string
  flightDate: string
  /** IATA code already chosen in the form, if any. */
  from?: string
  to?: string
  language: string
  t: TFunction
  onFill: (fill: FlightLookupFill) => void
  onInvalidFlightNo: () => void
  describeProblem: (problem: FieldProblem) => string
}) {
  const [lookingUp, setLookingUp] = useState(false)
  const [choices, setChoices] = useState<FlightLookup[]>([])
  const [message, setMessage] = useState<FlightLookupMessage | null>(null)
  const lookedUpFlightNo = useRef<string | null>(null)
  // The number as it is now, for answers that arrive after the user has typed on.
  const latestFlightNo = useRef(flightNo)
  useEffect(() => {
    latestFlightNo.current = flightNo
  }, [flightNo])

  // The routes belong to the number they were found for. Once it changes, they are gone.
  useEffect(() => {
    if (lookedUpFlightNo.current == null) return
    if (normalizeFlightNo(flightNo) === lookedUpFlightNo.current) return
    lookedUpFlightNo.current = null
    setChoices([])
    setMessage(null)
  }, [flightNo])

  function choose(route: FlightLookup) {
    onFill(fillFromLookup(route, language))
    lookedUpFlightNo.current = normalizeFlightNo(route.flightNo)
    setChoices([])
    setMessage({ kind: "info", text: t("flights.lookupFilled", { from: route.from.iata, to: route.to.iata }) })
  }

  async function lookUp() {
    const number = normalizeFlightNo(flightNo)
    if (!FLIGHT_NO_PATTERN.test(number)) {
      onInvalidFlightNo()
      return
    }

    setLookingUp(true)
    setChoices([])
    setMessage(null)
    try {
      const routes = await lookupFlight({ flightNo: number, date: flightDate, from, to })
      // The number may have been edited while the request was on its way; those routes
      // belong to a number that is no longer in the form.
      if (normalizeFlightNo(latestFlightNo.current) !== number) return

      const [only] = routes
      if (!only) {
        setMessage({ kind: "error", text: t("flights.lookupNotFound") })
      } else if (routes.length === 1) {
        choose(only)
      } else {
        lookedUpFlightNo.current = number
        setChoices(routes)
      }
    } catch (error) {
      if (normalizeFlightNo(latestFlightNo.current) !== number) return
      setMessage(failureMessage(error, t, describeProblem))
    } finally {
      setLookingUp(false)
    }
  }

  return { lookingUp, choices, message, lookUp, choose }
}
