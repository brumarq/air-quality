// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import type { AirQualityStation, Reading } from "@/domain/air-quality"
import { StationLimitBar } from "./station-limit-bar"

const station: AirQualityStation = { id: "1", name: "Esch/Alzette", lat: 0, lng: 0 }
const no2 = POLLUTANT_LIMITS[0]
const utc = (iso: string) => new Date(Date.parse(iso))

function barText(points: Reading[], live: boolean) {
  return no2 ? render(<StationLimitBar station={station} color="" points={points} limit={no2} live={live} />).container.textContent : ""
}

describe("StationLimitBar", () => {
  it("shows a 10:00Z reading as 11:00 Luxembourg time in winter and 12:00 in summer", () => {
    expect(barText([{ at: utc("2026-11-08T10:00:00Z"), value: 20, unit: "µg/m³" }], true)).toContain("11/8/2026, 11:00:00 AM")
    expect(barText([{ at: utc("2026-07-08T10:00:00Z"), value: 20, unit: "µg/m³" }], true)).toContain("7/8/2026, 12:00:00 PM")
  })

  it.fails("says how many readings were left out for having another unit", () => {
    const text = barText(
      [
        { at: utc("2026-11-08T09:00:00Z"), value: 20, unit: "µg/m³" },
        { at: utc("2026-11-08T10:00:00Z"), value: 0.02, unit: "ppm" },
      ],
      false,
    )
    expect(text).toContain("1 reading in other units ignored")
  })
})
