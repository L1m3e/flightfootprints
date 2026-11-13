import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRegister, useSession, useSignIn } from "@/features/auth/api"
import { AuthCard } from "@/features/auth/AuthCard"
import { ApiError } from "@/lib/api"

// The backend enforces the same rules; checking here only gives faster feedback.
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useSession()
  const register = useRegister()
  const signIn = useSignIn()

  const schema = useMemo(
    () =>
      z
        .object({
          username: z.string().trim().regex(USERNAME_PATTERN, t("validation.usernameFormat")),
          password: z.string().min(8, t("validation.passwordLength")).max(72, t("validation.passwordLength")),
          confirmPassword: z.string(),
        })
        .refine((values) => values.password === values.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMismatch"),
        }),
    [t],
  )
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  })
  const { errors, isSubmitting } = form.formState

  if (session?.authenticated) {
    return <Navigate to="/" replace />
  }

  async function onSubmit({ username, password }: Values) {
    try {
      await register.mutateAsync({ username, password })
      // Registering does not sign in by itself, so do that with the same credentials.
      await signIn.mutateAsync({ username, password })
      toast.success(t("auth.registered"))
      navigate("/", { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("username", { message: t("auth.usernameTaken") })
      } else if (error instanceof ApiError && error.status === 403) {
        form.setError("root", { message: t("auth.registrationClosed") })
      } else if (error instanceof ApiError && error.fieldProblems.length > 0) {
        // The backend found something the checks above let through.
        for (const problem of error.fieldProblems) {
          if (problem.field === "username" || problem.field === "password") {
            form.setError(problem.field, { message: problem.message })
          }
        }
      } else {
        form.setError("root", { message: t("errors.generic") })
      }
    }
  }

  const signInLink = (
    <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
      {t("auth.goSignIn")}
    </Link>
  )

  if (session && !session.registrationEnabled) {
    return (
      <AuthCard title={t("auth.registerTitle")} description={t("auth.registrationClosed")} footer={signInLink}>
        <p className="text-sm text-muted-foreground">{t("auth.registrationClosedBody")}</p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={t("auth.registerTitle")}
      description={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}
          {signInLink}
        </>
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
            <FieldDescription>{t("auth.usernameHint")}</FieldDescription>
            <FieldError errors={[errors.username]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldDescription>{t("auth.passwordHint")}</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">{t("auth.confirmPassword")}</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...form.register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <FieldError errors={[errors.root]} />

          <Button type="submit" disabled={isSubmitting}>
            {t("auth.submitRegister")}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
