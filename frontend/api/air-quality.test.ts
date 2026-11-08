import { afterEach, describe, expect, it, vi } from "vitest"
import { AirQualityApi } from "@/api/air-quality"

afterEach(() => vi.unstubAllGlobals())

function serveReadings(readings: unknown) {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify(readings))))
}

describe("reading timestamps", () => {
  it.fails("reads the backend's zoneless timestamps as UTC", async () => {
    serveReadings([{ timestamp: "2026-11-08T10:00:00", value: 20, unit: "µg/m³" }])
    const [point] = await AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))
    expect(new Date(point?.timestamp ?? "").toISOString()).toBe("2026-11-08T10:00:00.000Z")
  })

  it.fails("reads summer timestamps as UTC too", async () => {
    serveReadings([{ timestamp: "2026-07-08T10:00:00", value: 20, unit: "µg/m³" }])
    const [point] = await AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))
    expect(new Date(point?.timestamp ?? "").toISOString()).toBe("2026-07-08T10:00:00.000Z")
  })
})
