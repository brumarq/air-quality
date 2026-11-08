import { describe, expect, it } from "vitest"
import type { StationHistory } from "@/domain/air-quality"
import { TIME_RANGES } from "@/domain/time-ranges"
import { buildTrendChartModel } from "./trend-chart-model"

const utc = (iso: string) => new Date(Date.parse(iso))
const window = { from: utc("2026-11-08T09:00:00Z"), to: utc("2026-11-08T11:00:00Z") }

// Two stations with the same name: keying by name would merge them.
const history: StationHistory[] = [
  { station: { id: 9650, name: "Esch", lat: 0, lng: 0 }, points: [{ at: utc("2026-11-08T10:00:00Z"), value: 20, unit: "µg/m³" }] },
  { station: { id: 2163038, name: "Esch", lat: 0, lng: 0 }, points: [] },
]

describe("buildTrendChartModel", () => {
  it("keys rows by station id, not name", () => {
    const { rows, lines } = buildTrendChartModel(history, TIME_RANGES.day, window)
    expect(lines.map((l) => l.dataKey)).toEqual(["station-9650", "station-2163038"])
    expect(rows[1]).toEqual({ t: Date.parse("2026-11-08T10:00:00Z"), "station-9650": 20, "station-2163038": null })
  })

  it("marks the latest reading per station only in live mode", () => {
    expect(buildTrendChartModel(history, TIME_RANGES.live, window).liveDots).toEqual([
      { stationId: 9650, t: Date.parse("2026-11-08T10:00:00Z"), value: 20, color: expect.any(String) },
    ])
    expect(buildTrendChartModel(history, TIME_RANGES.day, window).liveDots).toEqual([])
  })

  it("labels hourly ticks in Luxembourg time", () => {
    expect(buildTrendChartModel(history, TIME_RANGES.day, window).formatTick(Date.parse("2026-11-08T10:00:00Z"))).toBe("11:00 AM")
  })

  it("reports the earliest reading, or null when there is none", () => {
    expect(buildTrendChartModel(history, TIME_RANGES.day, window).earliestAt?.toISOString()).toBe("2026-11-08T10:00:00.000Z")
    expect(buildTrendChartModel([], TIME_RANGES.day, window).earliestAt).toBeNull()
  })
})
