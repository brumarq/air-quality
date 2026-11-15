import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchHeatMapData } from "./api"
import { fixtureResponse } from "@/test/fixture-api"

afterEach(() => vi.unstubAllGlobals())

function serveRealFilesExcept(override: (path: string) => Response | null = () => null) {
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
  it("parses the real files into camelCase types with numeric years, and OSM's \"(unnamed)\" as no name", async () => {
    serveRealFilesExcept()
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
    serveRealFilesExcept((path) => (path.endsWith("heat-grid.geojson") ? status(404) : null))
    expect(await fetchHeatMapData("no-grid")).toEqual({ status: "not-prepared" })
  })

  it("tells a server error apart from 'not prepared'", async () => {
    serveRealFilesExcept((path) => (path.endsWith("stats.json") ? status(500) : null))
    expect((await fetchHeatMapData("server-error")).status).toBe("error")
  })

  it("treats a grid without its companion files as an error, since the pipeline writes them together", async () => {
    serveRealFilesExcept((path) => (path.endsWith("boundary.geojson") ? status(404) : null))
    expect((await fetchHeatMapData("half-prepared")).status).toBe("error")
  })

  it("loads fine without the optional study comparison", async () => {
    serveRealFilesExcept((path) => (path.endsWith("study-comparison.json") ? status(404) : null))
    const result = await fetchHeatMapData("no-study")
    expect(result.status === "ok" && result.data.studyComparison).toBeNull()
  })

  it("rejects a file with the wrong shape", async () => {
    serveRealFilesExcept((path) => (path.endsWith("stats.json") ? new Response(JSON.stringify({ years: { "2025": { commune_mean_c: "hot" } } })) : null))
    expect((await fetchHeatMapData("bad-shape")).status).toBe("error")
  })

  it("loads a commune's files once per visit, since the grid alone is ~800 KB", async () => {
    const fetchSpy = serveRealFilesExcept()
    await fetchHeatMapData("once-per-visit")
    const callsAfterFirstLoad = fetchSpy.mock.calls.length
    await fetchHeatMapData("once-per-visit")
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirstLoad)
  })

  it("retries after a failed load instead of caching the failure", async () => {
    let failing = true
    const fetchSpy = serveRealFilesExcept((path) => (failing && path.endsWith("stats.json") ? status(500) : null))
    expect((await fetchHeatMapData("flaky")).status).toBe("error")
    failing = false
    const callsAfterFailure = fetchSpy.mock.calls.length
    expect((await fetchHeatMapData("flaky")).status).toBe("ok")
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfterFailure)
  })
})

describe("the real Esch heat files", () => {
  it("have a study comparison whose hot and cool spots separate cleanly, so the story says the study agrees", async () => {
    serveRealFilesExcept()
    const result = await fetchHeatMapData("esch-sur-alzette")
    expect(result.status === "ok" && result.data.studyComparison?.cleanSeparation).toBe(true)
  })
})
