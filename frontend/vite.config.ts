import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Take the "@/..." import alias from tsconfig, so it is declared in one place only.
    tsconfigPaths: true,
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
