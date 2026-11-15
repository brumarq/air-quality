import { cloneElement, isValidElement, type ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/shared/domain/limits"
import type { StationHistory } from "./model"
import * as time from "./time"
import { TIME_RANGES, type TimeRangeOption } from "./model"
import { PollutantTrendChart, chartRows, latestReading } from "./pollutant-trend-chart"

vi.mock("recharts", async (importOriginal) => {
  const recharts = await importOriginal<typeof import("recharts")>()
  const sizedForJsdomWithoutLayout = ({ children }: { children: ReactNode }) =>
    isValidElement<{ width: number; height: number }>(children) ? cloneElement(children, { width: 800, height: 190 }) : null
  return { ...recharts, ResponsiveContainer: sizedForJsdomWithoutLayout }
})

const UNIT = "µg/m³"
const no2 = POLLUTANT_LIMITS.no2
const utc = (iso: string) => new Date(Date.parse(iso))
const window = { from: utc("2026-11-08T09:00:00Z"), to: utc("2026-11-08T11:00:00Z") }

const twoStationsNamedTwin: StationHistory[] = [
  { station: { id: 9650, name: "Twin", lat: 0, lng: 0, sensors: [] }, points: [{ at: utc("2026-11-08T10:00:00Z"), value: 20, unit: UNIT }] },
  { station: { id: 2163038, name: "Twin", lat: 0, lng: 0, sensors: [] }, points: [] },
]

const renderChart = (stations: StationHistory[], range: TimeRangeOption) =>
  render(<PollutantTrendChart history={{ status: "ready", data: { window, stations } }} limit={no2} range={range} />).container

describe("chartRows", () => {
  it("keys rows by station id, so two stations with the same name stay apart", () => {
    const rows = chartRows(twoStationsNamedTwin, UNIT, "hour", window)
    expect(rows[1]).toEqual({ bucketStartMs: Date.parse("2026-11-08T10:00:00Z"), "station-9650": 20, "station-2163038": null })
  })
})

describe("PollutantTrendChart", () => {
  it("draws the axis over the window the history was fetched for", () => {
    const bucket = vi.spyOn(time, "bucketTrend")
    renderChart([], TIME_RANGES.day)
    expect(bucket).not.toHaveBeenCalled()
    renderChart(twoStationsNamedTwin, TIME_RANGES.day)
    expect(bucket).toHaveBeenCalledWith(twoStationsNamedTwin, no2.unit, TIME_RANGES.day.granularity, window)
  })

  it("marks the latest reading per station only in live mode", () => {
    expect(renderChart(twoStationsNamedTwin, TIME_RANGES.live).querySelectorAll(".recharts-reference-dot")).toHaveLength(1)
    expect(renderChart(twoStationsNamedTwin, TIME_RANGES.day).querySelectorAll(".recharts-reference-dot")).toHaveLength(0)
  })

  it("labels hourly ticks in Luxembourg time", () => {
    expect(renderChart(twoStationsNamedTwin, TIME_RANGES.day).textContent).toContain("11:00")
  })

  it("reports the earliest reading, or says there is none rather than an Invalid Date", () => {
    expect(renderChart(twoStationsNamedTwin, TIME_RANGES.day).textContent).toContain("Data since 8 Nov 2026, 11:00.")
    expect(renderChart([], TIME_RANGES.day).textContent).toContain("No history for this pollutant yet.")
  })

  it("doesn't re-bucket the readings when the page re-renders with the same data", () => {
    const bucket = vi.spyOn(time, "bucketTrend")
    const history = { status: "ready", data: { window, stations: twoStationsNamedTwin } } as const
    const { rerender } = render(<PollutantTrendChart history={history} limit={no2} range={TIME_RANGES.day} />)
    rerender(<PollutantTrendChart history={history} limit={no2} range={TIME_RANGES.day} />)
    expect(bucket).toHaveBeenCalledTimes(1)
  })

  it("formats ticks with formatters built once, since toLocale… with options builds one per call", () => {
    const toLocale = vi.spyOn(Date.prototype, "toLocaleString")
    const toLocaleTime = vi.spyOn(Date.prototype, "toLocaleTimeString")
    const toLocaleDate = vi.spyOn(Date.prototype, "toLocaleDateString")
    const newFormatter = vi.spyOn(Intl, "DateTimeFormat")
    renderChart(twoStationsNamedTwin, TIME_RANGES.day)
    for (const spy of [toLocale, toLocaleTime, toLocaleDate, newFormatter]) expect(spy).not.toHaveBeenCalled()
  })

  it("shows loading and error states", () => {
    const { rerender } = render(<PollutantTrendChart history={{ status: "loading" }} limit={no2} range={TIME_RANGES.day} />)
    expect(screen.getByText("Loading...")).toBeTruthy()
    rerender(<PollutantTrendChart history={{ status: "error", error: new Error("x") }} limit={no2} range={TIME_RANGES.day} />)
    expect(screen.getByRole("alert").textContent).toBe("Couldn't load readings.")
  })
})

describe("PollutantTrendChart with mixed units", () => {
  const mixed: StationHistory[] = [
    {
      station: { id: 1, name: "A", lat: 0, lng: 0, sensors: [] },
      points: [
        { at: utc("2026-11-08T10:00:00Z"), value: 20, unit: UNIT },
        { at: utc("2026-11-08T10:30:00Z"), value: 0.02, unit: "ppm" },
      ],
    },
  ]

  it("plots and marks only readings in the limit's unit", () => {
    expect(chartRows(mixed, UNIT, "hour", window)[1]?.["station-1"]).toBe(20)
    expect(latestReading(mixed[0]?.points ?? [], UNIT)?.value).toBe(20)
  })
})
