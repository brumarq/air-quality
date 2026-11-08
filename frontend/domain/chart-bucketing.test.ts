import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { bucketTrend } from "@/domain/chart-bucketing"
import type { AirQualityStation } from "@/domain/air-quality"

const station: AirQualityStation = { id: 1, name: "S", lat: 0, lng: 0 }
const HOUR = 60 * 60 * 1000
const utc = (iso: string) => new Date(Date.parse(iso))

function hourly(fromIso: string, toIso: string, timestamps: string[] = []) {
  const points = timestamps.map((timestamp, i) => ({ at: utc(timestamp), value: i + 1, unit: "µg/m³" }))
  const { axis, series } = bucketTrend([{ station, points }], "hour", { from: utc(fromIso), to: utc(toIso) })
  return { axis: axis.map((d) => d.toISOString().slice(11, 16)), values: series[0]?.points ?? [] }
}

describe("hourly buckets across DST changes (Europe/Luxembourg)", () => {
  it("keeps 01:00Z on the autumn change night and separates the two readings", () => {
    const { axis, values } = hourly("2026-10-24T22:00:00Z", "2026-10-25T03:00:00Z", ["2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"])
    expect(axis).toEqual(["22:00", "23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(values).toEqual([null, null, 1, 2, null, null])
  })

  it("has one bucket per hour on the spring change night", () => {
    const { axis, values } = hourly("2026-03-28T23:00:00Z", "2026-03-29T03:00:00Z", ["2026-03-29T00:30:00Z", "2026-03-29T01:30:00Z"])
    expect(axis).toEqual(["23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(values).toEqual([null, 1, 2, null, null])
  })
})

describe("bucketTrend", () => {
  it("averages readings that share a bucket and keeps stations apart", () => {
    const window = { from: utc("2026-11-07T23:00:00Z"), to: utc("2026-11-08T22:59:00Z") }
    const other: AirQualityStation = { ...station, id: 2 }
    const { axis, series } = bucketTrend(
      [
        { station, points: [{ at: utc("2026-11-08T01:00:00Z"), value: 10, unit: "" }, { at: utc("2026-11-08T20:00:00Z"), value: 20, unit: "" }] },
        { station: other, points: [] },
      ],
      "day",
      window,
    )
    expect(axis.map((d) => d.toISOString())).toEqual(["2026-11-07T23:00:00.000Z"])
    expect(series).toEqual([
      { stationId: 1, points: [15] },
      { stationId: 2, points: [null] },
    ])
  })

  it("leaves out readings before the first bucket", () => {
    expect(hourly("2026-11-08T10:00:00Z", "2026-11-08T11:00:00Z", ["2026-11-08T09:59:00Z"]).values).toEqual([null, null])
  })
})

// Whole hours anywhere in 2026, with the evenings before both DST changes weighted in so
// every run crosses one.
const hourIn2026 = fc.oneof(
  fc.integer({ min: 0, max: 365 * 24 }).map((h) => Date.UTC(2026, 0, 1) + h * HOUR),
  fc.constantFrom(Date.UTC(2026, 2, 28, 20), Date.UTC(2026, 9, 24, 20)),
)

describe("hourly bucketing properties", () => {
  it("has one axis entry per hour in the window, both ends included", () => {
    fc.assert(
      fc.property(hourIn2026, fc.integer({ min: 0, max: 72 }), (from, hours) => {
        const { axis } = hourly(new Date(from).toISOString(), new Date(from + hours * HOUR).toISOString())
        expect(axis).toHaveLength(hours + 1)
      }),
    )
  })

  it("puts every point in exactly one bucket", () => {
    fc.assert(
      fc.property(hourIn2026, fc.integer({ min: 0, max: 48 * 60 - 1 }), (from, minute) => {
        const at = new Date(from + minute * 60 * 1000).toISOString()
        const { values } = hourly(new Date(from).toISOString(), new Date(from + 48 * HOUR).toISOString(), [at])
        expect(values.filter((v) => v !== null)).toEqual([1])
        expect(values.indexOf(1)).toBe(Math.floor(minute / 60))
      }),
    )
  })
})
