import { readFileSync } from "node:fs"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The version of the whole site is one line in the VERSION file in the repository root.
// The backend reads the same file (backend/build.gradle.kts), so the two cannot disagree.
const version = readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Replaced by the text of the version wherever the code says __APP_VERSION__.
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    // Take the "@/..." import alias from tsconfig, so it is declared in one place only.
    tsconfigPaths: true,
  },
  build: {
    // Vite warns about files over 500 kB. The one file above that is the MapLibre map
    // library (about 1.1 MB), which cannot be split further and is only downloaded when
    // the map page is opened. The limit sits just above it, so the warning still fires
    // if anything else grows that large.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Forward API calls to Spring Boot without rewriting the path. The browser only
      // ever talks to localhost:5173, so no CORS setup is needed and cookies behave the
      // same way as in production, where Spring Boot serves both the page and the API.
      "/api": "http://localhost:8080",
    },
  },
})
