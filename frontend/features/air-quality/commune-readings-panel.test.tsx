import { beforeAll, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/shared/domain/limits"
import type { AirQualityStation, Reading } from "./model"
import { StationLimitBar } from "./commune-readings-panel"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { eschNo2History } from "@/test/esch"

const station: AirQualityStation = { id: 1, name: "Station A", lat: 0, lng: 0, sensors: [] }
const no2 = POLLUTANT_LIMITS.no2
const utc = (iso: string) => new Date(Date.parse(iso))

function barText(points: Reading[], live: boolean) {
  return render(<StationLimitBar station={station} color="" points={points} limit={no2} live={live} />).container.textContent
}

describe("StationLimitBar", () => {
  it("shows a 10:00Z reading as 11:00 Luxembourg time in winter and 12:00 in summer", () => {
    expect(barText([{ at: utc("2026-11-08T10:00:00Z"), value: 20, unit: "µg/m³" }], true)).toContain("08/11/2026, 11:00:00")
    expect(barText([{ at: utc("2026-07-08T10:00:00Z"), value: 20, unit: "µg/m³" }], true)).toContain("08/07/2026, 12:00:00")
  })

  it("formats reading times with a formatter built once, since toLocaleString with options builds one per call", () => {
    const toLocale = vi.spyOn(Date.prototype, "toLocaleString")
    const newFormatter = vi.spyOn(Intl, "DateTimeFormat")
    barText([{ at: utc("2026-11-08T10:00:00Z"), value: 20, unit: "µg/m³" }], true)
    expect(toLocale).not.toHaveBeenCalled()
    expect(newFormatter).not.toHaveBeenCalled()
  })

  it("says how many readings were left out for having another unit", () => {
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

describe("StationLimitBar on real Esch NO2 readings", () => {
  beforeAll(stubFetchWithFixtures)

  it.each([
    ["live", 1, true, "Esch/Alzette20.4Latest reading · 07/11/2026, 23:00:00"],
    ["day", 1, false, "Esch/Alzette16.4Average of 11 readings · latest 07/11/2026, 23:00:00"],
    ["week", 7, false, "Esch/Alzette22.3Average of 53 readings · latest 07/11/2026, 23:00:00"],
  ])("%s", async (_name, days, live, alzette) => {
    const { history } = await eschNo2History(days)
    const text = history.map(({ station, points }) =>
      render(<StationLimitBar station={station} color="" points={points} limit={no2} live={live} />).container.textContent,
    )
    expect(text).toEqual([alzette, "Esch GareNo dataNo recent reading for this period"])
  })
})
