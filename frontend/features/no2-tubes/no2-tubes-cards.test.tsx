import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import type { No2TubeDataset } from "./model"
import { NO2ReductionCard, campaignYearBars } from "./no2-tubes-cards"

function dataset(readings: Record<string, { year: number; value: number }[]>): No2TubeDataset {
  return {
    campaignYears: [2023, 2025],
    tubes: Object.entries(readings).map(([id, r]) => ({ id, name: id, lat: 0, lng: 0, approximateLocation: false, readings: r })),
  }
}

const renderCard = (d: No2TubeDataset) =>
  render(<NO2ReductionCard dataset={d} selectedTubeId={null} onSelectTube={() => {}} />).container.textContent ?? ""

describe("NO2ReductionCard", () => {
  it("never shows NaN for a tube without readings", () => {
    const text = renderCard(dataset({ empty: [] }))
    expect(text).not.toContain("NaN")
    expect(text).toContain("No reading")
  })

  it("labels a tube whose latest reading is from an older year with that year", () => {
    renderCard(dataset({ current: [{ year: 2025, value: 25 }], stopped: [{ year: 2023, value: 28 }] }))
    expect(screen.getByRole("columnheader", { name: "Latest" })).toBeTruthy()
    expect(screen.getByRole("row", { name: /stopped/ }).textContent).toContain("28.0 (2023)")
  })

  it("names the shared year in the header when every value is from it", () => {
    renderCard(dataset({ a: [{ year: 2025, value: 25 }], b: [{ year: 2025, value: 22 }] }))
    expect(screen.getByRole("columnheader", { name: "2025" })).toBeTruthy()
  })
})

describe("NO2ReductionCard after the target year", () => {
  it("doesn't call a tube above the target 'already below' once the target year is reached", () => {
    renderCard(dataset({ late: [{ year: 2030, value: 30 }] }))
    expect(screen.getByRole("row", { name: /late/ }).textContent).not.toContain("already below")
  })
})

describe("campaignYearBars", () => {
  it("has one bar per campaign year, so a year without a reading shows as a gap", () => {
    const d = dataset({ stopped: [{ year: 2023, value: 28 }] })
    const [tube] = d.tubes
    if (!tube) throw new Error("no tube")
    expect(campaignYearBars(d, tube)).toEqual([{ year: 2023, value: 28 }, { year: 2025, value: null }])
  })
})
