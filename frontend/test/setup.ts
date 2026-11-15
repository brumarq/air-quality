import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
if (zone !== "Europe/Luxembourg") {
  throw new Error(`Tests must run with TZ=Europe/Luxembourg, got ${zone}`)
}
const locale = Intl.DateTimeFormat().resolvedOptions().locale
if (locale !== "en-US") {
  throw new Error(`Tests must run with the en-US locale, got ${locale}`)
}

afterEach(cleanup)
