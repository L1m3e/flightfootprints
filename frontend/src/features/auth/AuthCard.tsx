import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

/** The centred card shared by the sign-in and registration pages. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && <CardFooter className="justify-center gap-1 text-sm text-muted-foreground">{footer}</CardFooter>}
      </Card>
    </div>
  )
}
