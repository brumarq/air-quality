import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Fails the whole run if the zone or locale override in vitest.config.ts didn't reach the workers.
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
if (zone !== "Europe/Luxembourg") {
  throw new Error(`Tests must run with TZ=Europe/Luxembourg, got ${zone}`)
}
const locale = Intl.DateTimeFormat().resolvedOptions().locale
if (locale !== "en-US") {
  throw new Error(`Tests must run with the en-US locale, got ${locale}`)
}

// Testing Library only cleans up on its own when test globals are enabled; they aren't.
afterEach(cleanup)
