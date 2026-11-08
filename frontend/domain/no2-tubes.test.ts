import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { getReductionNeeded, type NO2TubeDataset } from "@/domain/no2-tubes"

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

const tube = fc.record({
  id: fc.string(),
  name: fc.string(),
  values: fc.array(fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }), {
    minLength: YEARS.length,
    maxLength: YEARS.length,
  }),
})

function datasetOf(tubes: { id: string; name: string; values: (number | null)[] }[]): NO2TubeDataset {
  return {
    commune: "test",
    pollutant: "no2",
    unit: "µg/m³",
    limitToday: 40,
    limit2030: 20,
    method: "",
    sources: Object.fromEntries(YEARS.map((y) => [String(y), { title: "", url: "", page: 1 }])),
    tubes: tubes.map((t) => ({
      id: t.id,
      name: t.name,
      tubeIds: [],
      lat: 0,
      lng: 0,
      approximateLocation: false,
      readings: Object.fromEntries(YEARS.map((y, i) => [String(y), t.values[i] ?? null])),
    })),
  }
}

describe("getReductionNeeded", () => {
  it.fails("never returns NaN, even for a tube with no readings", () => {
    fc.assert(
      fc.property(fc.array(tube, { maxLength: 6 }), (tubes) => {
        for (const row of getReductionNeeded(datasetOf(tubes))) {
          expect(Object.values(row).some((v) => typeof v === "number" && Number.isNaN(v))).toBe(false)
        }
      }),
      // A tube with no reading in any year is rare to generate at random; always check it.
      { examples: [[[{ id: "empty", name: "empty", values: YEARS.map(() => null) }]]] },
    )
  })
})
