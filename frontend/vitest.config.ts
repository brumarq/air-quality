import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Tests run in Luxembourg time so any code that leans on the machine's zone breaks here,
// not only for users. CI machines run in UTC, where those bugs stay hidden.
process.env.TZ = "Europe/Luxembourg"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    env: { TZ: "Europe/Luxembourg" },
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", ".next-e2e/**", "e2e/**"],
    setupFiles: ["./test/setup.ts"],
  },
})
