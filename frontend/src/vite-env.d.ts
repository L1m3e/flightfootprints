// Types for the variables read through import.meta.env. Vite only exposes variables whose
// name starts with VITE_ to the browser.
interface ImportMetaEnv {
  /** Optional: address of a MapLibre style to use as the basemap instead of OpenFreeMap's. */
  readonly VITE_MAP_STYLE_URL?: string
}

/** The version of the site, such as "0.2.0". Put in by Vite from the VERSION file; see vite.config.ts. */
declare const __APP_VERSION__: string
