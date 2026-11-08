import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Tests run in Luxembourg time so any code that leans on the machine's zone breaks here,
// not only for users. CI machines run in UTC, where those bugs stay hidden.
process.env.TZ = "Europe/Luxembourg"
// Same for the locale, so formatted dates in snapshots read the same on every machine.
process.env.LC_ALL = "en_US.UTF-8"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // tsconfig keeps JSX as-is for Next; tests need it compiled.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    env: { TZ: "Europe/Luxembourg", LC_ALL: "en_US.UTF-8" },
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", ".next-e2e/**", "e2e/**"],
    setupFiles: ["./test/setup.ts"],
  },
})
