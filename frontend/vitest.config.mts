import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

process.env.TZ = "Europe/Luxembourg"
process.env.LC_ALL = "en_US.UTF-8"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    env: { TZ: "Europe/Luxembourg", LC_ALL: "en_US.UTF-8" },
    exclude: ["node_modules/**", ".next/**", ".next-e2e/**", "e2e/**"],
    setupFiles: ["./test/setup.ts"],
    projects: [
      { extends: true, test: { name: "logic", include: ["**/*.test.ts"] } },
      { extends: true, test: { name: "components", include: ["**/*.test.tsx"], environment: "jsdom" } },
    ],
  },
})
