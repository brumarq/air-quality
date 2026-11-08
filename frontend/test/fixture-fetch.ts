import { vi } from "vitest"
import { fixtureResponse } from "./fixture-api"

const BASE = "http://localhost"

/** Replaces global fetch with the fixture backend for the current test file. */
export function stubFetchWithFixtures() {
  vi.stubGlobal("fetch", (input: string | URL) => {
    const response = fixtureResponse(new URL(input.toString(), BASE))
    if (!response) return Promise.reject(new Error(`No fixture for ${input.toString()}`))
    return Promise.resolve(
      new Response(response.body, { status: response.status, headers: { "content-type": response.contentType } }),
    )
  })
}
