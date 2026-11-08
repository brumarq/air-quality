// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { NO2TubeDataset } from "@/domain/no2-tubes"
import { NO2ReductionCard } from "./no2-reduction-card"

function dataset(readings: Record<string, Record<string, number | null>>): NO2TubeDataset {
  return {
    commune: "test",
    pollutant: "no2",
    unit: "µg/m³",
    limitToday: 40,
    limit2030: 20,
    method: "",
    sources: { "2023": { title: "", url: "", page: 1 }, "2025": { title: "", url: "", page: 1 } },
    tubes: Object.entries(readings).map(([id, r]) => ({
      id,
      name: id,
      tubeIds: [],
      lat: 0,
      lng: 0,
      approximateLocation: false,
      readings: r,
    })),
  }
}

const cardText = (d: NO2TubeDataset) =>
  render(<NO2ReductionCard dataset={d} selectedTubeId={null} onSelectTube={() => {}} />).container.textContent ?? ""

describe("NO2ReductionCard", () => {
  it.fails("never shows NaN for a tube without readings", () => {
    expect(cardText(dataset({ empty: { "2023": null, "2025": null } }))).not.toContain("NaN")
  })

  it.fails("labels a tube whose latest reading is from an older year with that year", () => {
    const text = cardText(dataset({ current: { "2023": 30, "2025": 25 }, stopped: { "2023": 28, "2025": null } }))
    expect(text).toContain("2023")
  })
})
