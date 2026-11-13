import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RequireAdmin } from "@/features/auth/RequireAdmin"
import { flightQuery, useCreateFlight, useUpdateFlight, type Flight, type FlightInput } from "@/features/flights/api"
import { FlightForm } from "@/features/flights/FlightForm"
import { NotFoundPage } from "@/pages/NotFoundPage"

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{title}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

export function NewFlightPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createFlight = useCreateFlight()

  async function save(input: FlightInput) {
    await createFlight.mutateAsync(input)
    toast.success(t("flights.created"))
    navigate("/")
  }

  return (
    <RequireAdmin>
      <FormCard title={t("flights.newTitle")}>
        <FlightForm onSubmit={save} />
      </FormCard>
    </RequireAdmin>
  )
}

export function EditFlightPage() {
  const id = Number(useParams().id)

  // "/flights/abc/edit" is simply an address that does not exist.
  if (!Number.isInteger(id) || id <= 0) {
    return <NotFoundPage />
  }
  return (
    <RequireAdmin>
      <EditFlight id={id} />
    </RequireAdmin>
  )
}

function EditFlight({ id }: { id: number }) {
  const { t } = useTranslation()
  const { data: flight, isPending, isError } = useQuery(flightQuery(id))

  if (isPending) {
    return (
      <FormCard title={t("flights.editTitle")}>
        <Skeleton className="h-96 w-full" />
      </FormCard>
    )
  }
  if (isError) {
    return <p className="py-20 text-center text-sm text-muted-foreground">{t("flights.notFound")}</p>
  }
  return (
    <FormCard title={t("flights.editTitle")}>
      {/* The form reads its starting values once, so it is only mounted when the flight is here. */}
      <EditFlightForm flight={flight} />
    </FormCard>
  )
}

function EditFlightForm({ flight }: { flight: Flight }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateFlight = useUpdateFlight(flight.id)

  async function save(input: FlightInput) {
    await updateFlight.mutateAsync(input)
    toast.success(t("flights.updated"))
    navigate("/")
  }

  return <FlightForm flight={flight} onSubmit={save} />
}
