// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import type { AirQualityStation } from "@/domain/air-quality"
import { StationLimitBar } from "./station-limit-bar"

const station: AirQualityStation = { id: "1", name: "Esch/Alzette", lat: 0, lng: 0 }
const no2 = POLLUTANT_LIMITS[0]

function barText(points: { timestamp: string; value: number; unit: string }[], live: boolean) {
  return no2 ? render(<StationLimitBar station={station} color="" points={points} limit={no2} live={live} />).container.textContent : ""
}

describe("StationLimitBar", () => {
  it.fails("shows a backend 10:00 (UTC) reading as 11:00 Luxembourg time", () => {
    expect(barText([{ timestamp: "2026-11-08T10:00:00", value: 20, unit: "µg/m³" }], true)).toContain("11:00:00 AM")
  })

  it.fails("says how many readings were left out for having another unit", () => {
    const text = barText(
      [
        { timestamp: "2026-11-08T09:00:00", value: 20, unit: "µg/m³" },
        { timestamp: "2026-11-08T10:00:00", value: 0.02, unit: "ppm" },
      ],
      false,
    )
    expect(text).toContain("1 reading in other units ignored")
  })
})
