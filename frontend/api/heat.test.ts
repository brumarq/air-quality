import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchHeatMapData } from "@/api/heat"

afterEach(() => vi.unstubAllGlobals())

describe("heat loader failures", () => {
  it.fails("tells a server error apart from 'not prepared'", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("boom", { status: 500 })))
    const result: unknown = await fetchHeatMapData("server-error-commune")
    expect(result).not.toBeNull()
  })

  it.fails("retries after a failed load instead of caching the failure", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response("boom", { status: 500 })))
    vi.stubGlobal("fetch", fetchSpy)
    await fetchHeatMapData("flaky-commune")
    const callsAfterFirstLoad = fetchSpy.mock.calls.length
    await fetchHeatMapData("flaky-commune")
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfterFirstLoad)
  })
})
