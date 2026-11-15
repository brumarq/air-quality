import { afterEach, describe, expect, it } from "vitest"
import { bucketTrend, bucketAxis } from "@/features/air-quality/time"
import { TIME_RANGES } from "@/features/air-quality/model"
import type { StationHistory } from "@/features/air-quality/model"
import { formatDataSince, formatTick } from "@/features/air-quality/pollutant-trend-chart"
import { formatReadingTime } from "@/features/air-quality/commune-readings-panel"

const ORIGINAL_ZONE = process.env.TZ
afterEach(() => {
  process.env.TZ = ORIGINAL_ZONE
})

const utc = (iso: string) => new Date(Date.parse(iso))
const UNIT = "µg/m³"
const history: StationHistory[] = [
  {
    station: { id: 1, name: "A", lat: 0, lng: 0, sensors: [] },
    points: ["2026-10-24T21:30:00Z", "2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z", "2026-10-26T09:00:00Z"].map((iso, i) => ({
      at: utc(iso),
      value: i + 1,
      unit: UNIT,
    })),
  },
]
const window = { from: utc("2026-10-24T20:00:00Z"), to: utc("2026-10-27T20:00:00Z") }

function zoneSensitiveOutputs() {
  return {
    axes: (["hour", "day", "month"] as const).map((g) => bucketAxis(g, window).map((d) => d.toISOString())),
    buckets: (["hour", "day", "month"] as const).map((g) => bucketTrend(history, UNIT, g, window)),
    ticks: (["live", "week", "month", "year"] as const).map((key) => {
      const granularity = TIME_RANGES[key].granularity
      return bucketAxis(granularity, window).map((start) => formatTick(granularity, start.getTime()))
    }),
    labels: [formatReadingTime(utc("2026-11-08T10:00:00Z")), formatDataSince(utc("2026-07-08T10:00:00Z"))],
  }
}

describe("time code doesn't depend on the machine's zone, which the suite's own Luxembourg zone can't catch", () => {
  it.each(["UTC", "America/Sao_Paulo", "Asia/Kolkata", "Pacific/Auckland"])("gives the same output in %s", (zone) => {
    const inLuxembourg = zoneSensitiveOutputs()
    process.env.TZ = zone
    expect(new Date(Date.UTC(2026, 10, 8, 10)).getTimezoneOffset()).not.toBe(-60)
    expect(zoneSensitiveOutputs()).toEqual(inLuxembourg)
  })

  it("still shows a 10:00Z reading as 11:00 Luxembourg time from another zone", () => {
    process.env.TZ = "America/Sao_Paulo"
    expect(formatReadingTime(utc("2026-11-08T10:00:00Z"))).toBe("08/11/2026, 11:00:00")
  })
})
