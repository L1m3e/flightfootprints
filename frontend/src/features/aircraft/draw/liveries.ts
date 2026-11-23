import type { ReactNode } from "react"

import type { FlagCode } from "@/features/aircraft/draw/flags"
import { AirChinaMark } from "@/features/aircraft/draw/tailMarks"

/** How an airline paints its aircraft, reduced to what a small flat drawing can show. */
export interface Livery {
  /** Fuselage above the beltline. */
  upper: string
  /** Fuselage below it. */
  belly: string
  /** Stripes along the beltline, listed top to bottom. Widths in metres. */
  cheatlines: readonly { colour: string; width: number }[]
  fin: string
  /** Engine cowls, where the airline paints them. */
  engines?: string
  titles?: {
    latin: string
    cjk?: string
    colour: string
    /** Roman capitals instead of the page's sans-serif. */
    serif?: boolean
    /** Brush-style characters, for names that are written in calligraphy on the aircraft. */
    brush?: boolean
  }
  /** The national flag in front of the name. */
  flag?: FlagCode
  /** The airline's mark on the fin, drawn in a box of 100 × 100 units. */
  TailMark?: () => ReactNode
}

/** An aircraft straight from the factory: used when the airline is not known. */
export const PLAIN_LIVERY: Livery = {
  upper: "#ffffff",
  belly: "#d8dce3",
  cheatlines: [],
  fin: "#ffffff",
}

/** By IATA designator. Colours are close to the real ones, not official values. */
export const LIVERIES: Partial<Record<string, Livery>> = {
  CA: {
    upper: "#ffffff",
    belly: "#d5d9e0",
    cheatlines: [{ colour: "#1d4f9e", width: 0.32 }],
    fin: "#ffffff",
    titles: { latin: "AIR CHINA", cjk: "中国国际航空公司", colour: "#1b1b1f", serif: true, brush: true },
    flag: "CN",
    TailMark: AirChinaMark,
  },
}
