// Serves the backend fixtures in test/fixtures/api (captured from the real backend on
// 2026-11-08, naive UTC timestamps included) and the static files in public/. Shared by
// the Vitest fetch stub and the Playwright route handler, so both see the same data.

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"

const ROOT = join(__dirname, "..")
const API_PATH = "/api/v1/air-quality"

const readJson = (path: string): unknown => JSON.parse(readFileSync(join(ROOT, path), "utf8"))

const NaiveReading = z.object({ timestamp: z.string() }).passthrough()
const locations = z.array(z.unknown()).parse(readJson("test/fixtures/api/locations.json"))
const sensors = z.record(z.array(z.unknown())).parse(readJson("test/fixtures/api/sensors.json"))
const readings = z.record(z.array(NaiveReading)).parse(readJson("test/fixtures/api/readings.json"))

export interface FixtureResponse {
  status: number
  body: string
  contentType: string
}

const json = (value: unknown): FixtureResponse => ({
  status: 200,
  body: JSON.stringify(value),
  contentType: "application/json",
})
const notFound: FixtureResponse = { status: 404, body: "not found", contentType: "text/plain" }

/** The response the fixture backend gives for `url`, or null if the URL isn't one it serves. */
export function fixtureResponse(url: URL): FixtureResponse | null {
  if (url.pathname.startsWith("/data/")) {
    try {
      return { status: 200, body: readFileSync(join(ROOT, "public", url.pathname), "utf8"), contentType: "application/json" }
    } catch {
      return notFound
    }
  }

  if (!url.pathname.startsWith(API_PATH)) return null
  const path = url.pathname.slice(API_PATH.length)

  if (path === "/locations") return json(locations)

  const sensorsMatch = /^\/locations\/(\d+)\/sensors$/.exec(path)
  if (sensorsMatch?.[1] !== undefined) return json(sensors[sensorsMatch[1]] ?? [])

  const readingsMatch = /^\/sensors\/(\d+)\/readings$/.exec(path)
  if (readingsMatch?.[1] !== undefined) {
    // Same filter as the backend: naive UTC strings, inclusive on both ends. ISO strings
    // of equal length compare correctly as text.
    const from = url.searchParams.get("from") ?? ""
    const to = url.searchParams.get("to") ?? ""
    const all = readings[readingsMatch[1]] ?? []
    return json(all.filter((r) => r.timestamp >= from && r.timestamp <= to))
  }

  return notFound
}
