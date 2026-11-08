import { afterEach, describe, expect, it, vi } from "vitest"
import { AirQualityApi, UtcTimestampSchema } from "@/api/air-quality"

afterEach(() => vi.unstubAllGlobals())

function serveReadings(readings: unknown) {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify(readings))))
}

const reading = (timestamp: string, value = 20) => ({ timestamp, value, unit: "µg/m³" })

describe("reading timestamps", () => {
  it("reads the backend's zoneless timestamps as UTC", async () => {
    serveReadings([reading("2026-11-08T10:00:00")])
    const [point] = await AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))
    expect(point?.at.toISOString()).toBe("2026-11-08T10:00:00.000Z")
  })

  it("reads summer timestamps as UTC too", async () => {
    serveReadings([reading("2026-07-08T10:00:00")])
    const [point] = await AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))
    expect(point?.at.toISOString()).toBe("2026-07-08T10:00:00.000Z")
  })

  it("returns readings oldest first whatever order the backend sends", async () => {
    serveReadings([reading("2026-11-08T11:00:00", 2), reading("2026-11-08T09:00:00", 0), reading("2026-11-08T10:00:00", 1)])
    const points = await AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))
    expect(points.map((p) => p.value)).toEqual([0, 1, 2])
  })

  it("rejects a reading whose timestamp isn't zoneless UTC", async () => {
    serveReadings([reading("2026-11-08T10:00:00+01:00")])
    await expect(AirQualityApi.getSensorReadingHistory(1, new Date(0), new Date(0))).rejects.toThrow(/zoneless UTC timestamp/)
  })
})

describe("UtcTimestampSchema", () => {
  it.each([
    ["2026-11-08T10:00:00", "2026-11-08T10:00:00.000Z"],
    ["2026-11-08T10:00", "2026-11-08T10:00:00.000Z"],
    ["2026-11-08T10:00:00.250", "2026-11-08T10:00:00.250Z"],
  ])("accepts %s", (input, expected) => {
    expect(UtcTimestampSchema.parse(input).toISOString()).toBe(expected)
  })

  it.each(["2026-11-08T10:00:00Z", "2026-11-08T10:00:00+01:00", "2026-11-08", "2026-13-40T10:00:00", "yesterday"])(
    "rejects %s",
    (input) => {
      expect(UtcTimestampSchema.safeParse(input).success).toBe(false)
    },
  )
})
