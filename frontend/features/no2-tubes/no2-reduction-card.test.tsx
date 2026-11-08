// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { NO2_LIMITS } from "@/domain/limits"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { NO2ReductionCard } from "./no2-reduction-card"

function dataset(readings: Record<string, { year: number; value: number }[]>): No2TubeDataset {
  return {
    commune: "test",
    unit: "µg/m³",
    method: "",
    campaignYears: [2023, 2025],
    sources: [],
    tubes: Object.entries(readings).map(([id, r]) => ({ id, name: id, tubeIds: [], lat: 0, lng: 0, approximateLocation: false, readings: r })),
  }
}

const renderCard = (d: No2TubeDataset) =>
  render(<NO2ReductionCard dataset={d} limits={NO2_LIMITS} selectedTubeId={null} onSelectTube={() => {}} />).container.textContent ?? ""

describe("NO2ReductionCard", () => {
  it("never shows NaN for a tube without readings", () => {
    const text = renderCard(dataset({ empty: [] }))
    expect(text).not.toContain("NaN")
    expect(text).toContain("No reading")
  })

  it("labels a tube whose latest reading is from an older year with that year", () => {
    renderCard(dataset({ current: [{ year: 2025, value: 25 }], stopped: [{ year: 2023, value: 28 }] }))
    expect(screen.getByRole("columnheader", { name: "Latest" })).toBeTruthy()
    expect(screen.getByRole("row", { name: /stopped/ }).textContent).toContain("28 (2023)")
  })

  it("names the shared year in the header when every value is from it", () => {
    renderCard(dataset({ a: [{ year: 2025, value: 25 }], b: [{ year: 2025, value: 22 }] }))
    expect(screen.getByRole("columnheader", { name: "2025" })).toBeTruthy()
  })
})
