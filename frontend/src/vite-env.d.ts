// Types for the variables read through import.meta.env. Vite only exposes variables whose
// name starts with VITE_ to the browser.
interface ImportMetaEnv {
  /** Optional: address of a MapLibre style to use as the basemap instead of OpenFreeMap's. */
  readonly VITE_MAP_STYLE_URL?: string
}
