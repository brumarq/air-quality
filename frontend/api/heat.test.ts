import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchHeatMapData } from "@/api/heat"
import { fixtureResponse } from "@/test/fixture-api"

afterEach(() => vi.unstubAllGlobals())

/** Serves the real Esch files, with `override` replacing the response for some paths. */
function serveEsch(override: (path: string) => Response | null = () => null) {
  const fetchSpy = vi.fn((input: string) => {
    const path = new URL(input, "http://localhost").pathname.replace(/^\/data\/[^/]+\//, "/data/esch-sur-alzette/")
    const replaced = override(path)
    if (replaced) return Promise.resolve(replaced)
    const fixture = fixtureResponse(new URL(path, "http://localhost"))
    return Promise.resolve(new Response(fixture?.body ?? "", { status: fixture?.status ?? 404 }))
  })
  vi.stubGlobal("fetch", fetchSpy)
  return fetchSpy
}

const status = (code: number) => new Response("", { status: code })

describe("fetchHeatMapData", () => {
  it("parses the Esch files into camelCase types with numeric years", async () => {
    serveEsch()
    const result = await fetchHeatMapData("parse-check")
    if (result.status !== "ok") throw new Error(result.status)
    const { data } = result
    expect(data.years).toEqual([2022, 2023, 2024, 2025])
    expect(data.cells).toHaveLength(1483)
    expect(data.cells[0]?.years.map((y) => y.year)).toEqual([2022, 2023, 2024, 2025])
    expect(data.stats.map((s) => s.year)).toEqual([2022, 2023, 2024, 2025])
    expect(data.buildings).toHaveLength(28)
    expect(data.buildings.filter((b) => b.name === null)).toHaveLength(6)
    expect(data.studyComparison?.points[0]?.lngLat).toEqual([5.9785, 49.4919])
  })

  it("reports a commune without a grid file as not prepared", async () => {
    serveEsch((path) => (path.endsWith("heat-grid.geojson") ? status(404) : null))
    expect(await fetchHeatMapData("no-grid")).toEqual({ status: "not-prepared" })
  })

  it("tells a server error apart from 'not prepared'", async () => {
    serveEsch((path) => (path.endsWith("stats.json") ? status(500) : null))
    expect((await fetchHeatMapData("server-error")).status).toBe("error")
  })

  it("treats a grid without its companion files as an error", async () => {
    serveEsch((path) => (path.endsWith("boundary.geojson") ? status(404) : null))
    expect((await fetchHeatMapData("half-prepared")).status).toBe("error")
  })

  it("loads fine without the optional study comparison", async () => {
    serveEsch((path) => (path.endsWith("study-comparison.json") ? status(404) : null))
    const result = await fetchHeatMapData("no-study")
    expect(result.status === "ok" && result.data.studyComparison).toBeNull()
  })

  it("rejects a file with the wrong shape", async () => {
    serveEsch((path) => (path.endsWith("stats.json") ? new Response(JSON.stringify({ years: { "2025": { commune_mean_c: "hot" } } })) : null))
    expect((await fetchHeatMapData("bad-shape")).status).toBe("error")
  })

  it("retries after a failed load instead of caching the failure", async () => {
    let failing = true
    const fetchSpy = serveEsch((path) => (failing && path.endsWith("stats.json") ? status(500) : null))
    expect((await fetchHeatMapData("flaky")).status).toBe("error")
    failing = false
    const callsAfterFailure = fetchSpy.mock.calls.length
    expect((await fetchHeatMapData("flaky")).status).toBe("ok")
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfterFailure)
  })
})
