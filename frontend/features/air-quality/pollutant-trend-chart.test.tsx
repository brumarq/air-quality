// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import { TIME_RANGES } from "@/domain/time-ranges"
import { PollutantTrendChart } from "./pollutant-trend-chart"
import * as model from "./trend-chart-model"

const window = { from: new Date(Date.UTC(2026, 10, 7, 12)), to: new Date(Date.UTC(2026, 10, 8, 12)) }

describe("PollutantTrendChart", () => {
  it("draws the axis over the window the history was fetched for", () => {
    const build = vi.spyOn(model, "buildTrendChartModel")
    render(<PollutantTrendChart history={{ status: "ready", data: { window, stations: [] } }} limit={POLLUTANT_LIMITS.no2} range={TIME_RANGES.day} />)
    expect(build).toHaveBeenCalledWith([], TIME_RANGES.day, window)
  })

  it("shows loading and error states", () => {
    const { rerender } = render(<PollutantTrendChart history={{ status: "loading" }} limit={POLLUTANT_LIMITS.no2} range={TIME_RANGES.day} />)
    expect(screen.getByText("Loading...")).toBeTruthy()
    rerender(<PollutantTrendChart history={{ status: "error", error: new Error("x") }} limit={POLLUTANT_LIMITS.no2} range={TIME_RANGES.day} />)
    expect(screen.getByRole("alert").textContent).toBe("Couldn't load readings.")
  })
})
