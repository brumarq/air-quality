import { defineConfig, devices } from "@playwright/test"
import { FIXTURE_API_BASE_URL } from "./e2e/fixture-routes"

const PORT = 3100
const E2E_ENV = `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=${FIXTURE_API_BASE_URL}`

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    timezoneId: "Europe/Luxembourg",
    locale: "en-US",
  },
  webServer: {
    // Built into .next-e2e so it doesn't touch a running `next dev`. The API base URL
    // points at a host that doesn't exist; every request to it is answered by
    // e2e/fixture-routes.ts.
    command: `${E2E_ENV} npx next build && ${E2E_ENV} npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
  },
})
