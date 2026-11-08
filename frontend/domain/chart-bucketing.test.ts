import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { bucketTrendData } from "@/domain/chart-bucketing"
import type { AirQualityStation } from "@/domain/air-quality"

const station: AirQualityStation = { id: "1", name: "S", lat: 0, lng: 0 }
const HOUR = 60 * 60 * 1000

function hourly(fromIso: string, toIso: string, timestamps: string[] = []) {
  const points = timestamps.map((timestamp, i) => ({ at: new Date(Date.parse(timestamp)), value: i + 1, unit: "µg/m³" }))
  return bucketTrendData([{ station, points }], "day", new Date(fromIso), new Date(toIso)).rows
}

describe("hourly buckets across DST changes (Europe/Luxembourg)", () => {
  it.fails("keeps 01:00Z on the autumn change night and separates the two readings", () => {
    const rows = hourly("2026-10-24T22:00:00Z", "2026-10-25T03:00:00Z", ["2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"])
    expect(rows.map((r) => r.timestamp.slice(11, 16))).toEqual(["22:00", "23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(rows.find((r) => r.timestamp.startsWith("2026-10-25T01:00"))?.S).toBe(2)
  })

  it("has one bucket per hour on the spring change night", () => {
    const rows = hourly("2026-03-28T23:00:00Z", "2026-03-29T03:00:00Z", ["2026-03-29T00:30:00Z", "2026-03-29T01:30:00Z"])
    expect(rows.map((r) => r.timestamp.slice(11, 16))).toEqual(["23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(rows.map((r) => r.S ?? null)).toEqual([null, 1, 2, null, null])
  })
})

// Whole hours anywhere in 2026, with the evenings before both DST changes weighted in so
// every run crosses one.
const hourIn2026 = fc.oneof(
  fc.integer({ min: 0, max: 365 * 24 }).map((h) => Date.UTC(2026, 0, 1) + h * HOUR),
  fc.constantFrom(Date.UTC(2026, 2, 28, 20), Date.UTC(2026, 9, 24, 20)),
)

describe("hourly bucketing properties", () => {
  it.fails("has one axis entry per hour in the window, both ends included", () => {
    fc.assert(
      fc.property(hourIn2026, fc.integer({ min: 0, max: 72 }), (from, hours) => {
        const rows = hourly(new Date(from).toISOString(), new Date(from + hours * HOUR).toISOString())
        expect(rows).toHaveLength(hours + 1)
      }),
    )
  })

  it("puts every point in exactly one bucket", () => {
    fc.assert(
      fc.property(hourIn2026, fc.integer({ min: 0, max: 48 * 60 - 1 }), (from, minute) => {
        const at = new Date(from + minute * 60 * 1000).toISOString()
        const rows = hourly(new Date(from).toISOString(), new Date(from + 48 * HOUR).toISOString(), [at])
        expect(rows.filter((r) => r.S !== undefined)).toHaveLength(1)
      }),
    )
  })
})
