import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { NO2_LIMITS } from "@/domain/limits"
import { classifyNo2, getReductionNeeded, type No2Tube, type No2TubeDataset } from "@/domain/no2-tubes"

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

function tubeOf(id: string, values: Record<number, number>): No2Tube {
  return {
    id,
    name: id,
    tubeIds: [],
    lat: 0,
    lng: 0,
    approximateLocation: false,
    readings: Object.entries(values)
      .map(([year, value]) => ({ year: Number(year), value }))
      .sort((a, b) => a.year - b.year),
  }
}

const datasetOf = (tubes: No2Tube[]): No2TubeDataset => ({
  commune: "test",
  unit: "µg/m³",
  method: "",
  campaignYears: YEARS,
  sources: YEARS.map((year) => ({ year, title: "", url: "https://example.org", page: 1 })),
  tubes,
})

const arbitraryTube = fc
  .tuple(fc.string(), fc.array(fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }), { minLength: 8, maxLength: 8 }))
  .map(([id, values]) => tubeOf(id, Object.fromEntries(YEARS.flatMap((y, i) => (values[i] == null ? [] : [[y, values[i]]])))))

describe("getReductionNeeded", () => {
  it("never returns NaN, even for a tube with no readings", () => {
    fc.assert(
      fc.property(fc.array(arbitraryTube, { maxLength: 6 }), (tubes) => {
        for (const row of getReductionNeeded(datasetOf(tubes), NO2_LIMITS)) {
          expect(Object.values(row).some((v) => typeof v === "number" && !Number.isFinite(v))).toBe(false)
        }
      }),
      { examples: [[[tubeOf("empty", {})]]] },
    )
  })

  it("reports a tube with no readings as no-data", () => {
    expect(getReductionNeeded(datasetOf([tubeOf("empty", {})]), NO2_LIMITS)).toEqual([{ status: "no-data", tubeId: "empty", name: "empty" }])
  })

  it("compares with the previous calendar year, not the previous reading", () => {
    const [gap] = getReductionNeeded(datasetOf([tubeOf("gap", { 2022: 30, 2025: 25 })]), NO2_LIMITS)
    expect(gap).toMatchObject({ status: "ok", latestYear: 2025, changeVsPreviousYear: null })
    const [next] = getReductionNeeded(datasetOf([tubeOf("next", { 2024: 30, 2025: 25 })]), NO2_LIMITS)
    expect(next).toMatchObject({ status: "ok", changeVsPreviousYear: -5 })
  })

  it("needs no reduction once at or below the target, or after the target year", () => {
    const rows = getReductionNeeded(datasetOf([tubeOf("below", { 2025: 20 }), tubeOf("above", { 2025: 30 })]), NO2_LIMITS)
    expect(rows.map((r) => (r.status === "ok" ? r.neededPerYear : "no-data"))).toEqual([null, 2])
    expect(getReductionNeeded(datasetOf([tubeOf("late", { 2025: 30 })]), { ...NO2_LIMITS, targetYear: 2025 })[0]).toMatchObject({ neededPerYear: null })
  })
})

describe("classifyNo2", () => {
  it.each([
    [41, "above-limit"],
    [40, "above-2030"],
    [21, "above-2030"],
    [20, "above-who"],
    [10.1, "above-who"],
    [10, "within-who"],
  ] as const)("%d µg/m³ is %s", (value, band) => {
    expect(classifyNo2(value, NO2_LIMITS)).toBe(band)
  })
})
