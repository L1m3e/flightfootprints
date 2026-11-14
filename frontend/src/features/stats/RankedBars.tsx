import type { ReactNode } from "react"

export interface RankedRow {
  key: string
  label: ReactNode
  /** The number the bar represents. */
  value: number
  /** The same number written out, with whatever else belongs beside it. */
  figure: string
}

/**
 * A ranking as a list: name, figure and a bar per row, largest first.
 *
 * All bars have the same colour. The categories (airlines, airports) have no order of
 * their own, so shading by size would only repeat what the bar's length already says.
 */
export function RankedBars({ rows }: { rows: RankedRow[] }) {
  const largest = Math.max(1, ...rows.map((row) => row.value))

  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{row.label}</span>
            {/* tabular-nums here: these figures sit in a column and should line up. */}
            <span className="shrink-0 text-muted-foreground tabular-nums">{row.figure}</span>
          </div>
          {/* The figure above already states the value, so the bar is decoration to a
              screen reader. Square at the baseline on the left, rounded at the data end. */}
          {/* Thin on purpose: a stack of long, thick, saturated bars would shout over the text. */}
          <div className="mt-1.5 h-1.5" aria-hidden="true">
            <div
              className="h-full rounded-r-[3px] bg-chart-1"
              // Never thinner than 4px, so the smallest value still shows as a bar.
              style={{ width: `max(4px, ${(row.value / largest) * 100}%)` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
