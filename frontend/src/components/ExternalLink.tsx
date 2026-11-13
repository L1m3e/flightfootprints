import type { ReactNode } from "react"

/** A link to another site: opens in a new tab and does not pass the referrer along. */
export function ExternalLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
      {children}
    </a>
  )
}
