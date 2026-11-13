import type { StyleSpecification } from "maplibre-gl"

/**
 * Colours of the layers drawn on the map. MapLibre paints with WebGL and cannot read the
 * CSS variables of the page theme, so the few colours the map needs are repeated here.
 */
export const MAP_COLORS = {
  arc: "#1d2748",
  arcSelected: "#e8890c",
  airportFill: "#ffffff",
  airportStroke: "#1d2748",
  label: "#1d2748",
  labelHalo: "#ffffff",
  emptyBackground: "#eef0f3",
} as const

/** Basemap: OpenFreeMap's "positron" style, free to use and without an API key. */
export const BASEMAP_STYLE_URL: string =
  import.meta.env.VITE_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron"

/** Font of the airport labels. It has to be one that the basemap's font server offers. */
export const LABEL_FONT = ["Noto Sans Bold"]

/**
 * Used when the basemap cannot be loaded: a plain background and nothing else. The
 * routes and airports are our own data and are still drawn on top of it.
 */
export const EMPTY_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": MAP_COLORS.emptyBackground } }],
}
