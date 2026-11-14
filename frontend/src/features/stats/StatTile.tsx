import { cn } from "cn"
import type { ReactNode } from "react"

/**
 * One headline number. The number itself is the display: a chart with a single bar
 * would say the same thing with more ink.
 */
export function StatTile({
  label,
  value,
  unit,
  lead = false,
  className,
  children,
}: {
  label: string
  value: string
  /** Shown small after the value, for example "km". */
  unit?: string
  /** The one figure the page leads with gets a larger number. Use it once per page. */
  lead?: boolean
  className?: string
  /** Extra lines under the value, such as the same distance in miles. */
  children?: ReactNode
}) {
  return (
    <div className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      {/* Deliberately not tabular-nums: at this size equal-width digits look loose.
          Equal-width digits are for columns of numbers that must line up. */}
      <p className={cn("mt-1 font-semibold tracking-tight", lead ? "text-5xl" : "text-3xl")}>
        {value}
        {unit && <span className="ml-1.5 text-base font-normal tracking-normal text-muted-foreground">{unit}</span>}
      </p>
      {children && <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}
