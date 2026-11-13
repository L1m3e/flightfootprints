import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSession, useSignIn } from "@/features/auth/api"
import { AuthCard } from "@/features/auth/AuthCard"
import { ApiError } from "@/lib/api"

export function SignInPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useSession()
  const signIn = useSignIn()

  // The schema is rebuilt when the language changes, so its messages follow the toggle.
  const schema = useMemo(
    () =>
      z.object({
        username: z.string().trim().min(1, t("validation.required")),
        password: z.string().min(1, t("validation.required")),
      }),
    [t],
  )
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  // A guarded page sends visitors here and says where they wanted to go.
  const destination = (location.state as { from?: string } | null)?.from ?? "/"

  if (session?.authenticated) {
    return <Navigate to={destination} replace />
  }

  async function onSubmit(values: Values) {
    try {
      await signIn.mutateAsync(values)
      toast.success(t("auth.signedIn", { username: values.username }))
      navigate(destination, { replace: true })
    } catch (error) {
      const wrongCredentials = error instanceof ApiError && error.status === 401
      form.setError("root", { message: t(wrongCredentials ? "auth.invalidCredentials" : "errors.generic") })
    }
  }

  return (
    <AuthCard
      title={t("auth.signInTitle")}
      description={t("auth.signInSubtitle")}
      footer={
        session?.registrationEnabled && (
          <>
            {t("auth.noAccount")}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-2">
              {t("auth.goRegister")}
            </Link>
          </>
        )
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="username">{t("auth.username")}</FieldLabel>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!errors.username}
              {...form.register("username")}
            />
            <FieldError errors={[errors.username]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <FieldError errors={[errors.root]} />

          <Button type="submit" disabled={isSubmitting}>
            {t("auth.submitSignIn")}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
