import { beforeAll, describe, expect, it } from "vitest"
import fc from "fast-check"
import { classifyNo2, getReductionNeeded, type No2Tube, type No2TubeDataset } from "./model"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { loadEschTubes } from "@/test/esch"

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

function tubeOf(id: string, values: Record<number, number>): No2Tube {
  return {
    id,
    name: id,
    lat: 0,
    lng: 0,
    approximateLocation: false,
    readings: Object.entries(values)
      .map(([year, value]) => ({ year: Number(year), value }))
      .sort((a, b) => a.year - b.year),
  }
}

const datasetOf = (tubes: No2Tube[]): No2TubeDataset => ({
  campaignYears: YEARS,
  tubes,
})

const arbitraryTube = fc
  .tuple(fc.string(), fc.array(fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }), { minLength: 8, maxLength: 8 }))
  .map(([id, values]) => tubeOf(id, Object.fromEntries(YEARS.flatMap((y, i) => (values[i] == null ? [] : [[y, values[i]]])))))

describe("getReductionNeeded", () => {
  it("never returns NaN, even for a tube with no readings", () => {
    fc.assert(
      fc.property(fc.array(arbitraryTube, { maxLength: 6 }), (tubes) => {
        for (const row of getReductionNeeded(datasetOf(tubes))) {
          expect(Object.values(row).some((v) => typeof v === "number" && !Number.isFinite(v))).toBe(false)
        }
      }),
      { examples: [[[tubeOf("empty", {})]]] },
    )
  })

  it("reports a tube with no readings as no-data", () => {
    expect(getReductionNeeded(datasetOf([tubeOf("empty", {})]))).toEqual([{ status: "no-data", tubeId: "empty", name: "empty" }])
  })

  it("compares with the previous calendar year, not the previous reading", () => {
    const [gap] = getReductionNeeded(datasetOf([tubeOf("gap", { 2022: 30, 2025: 25 })]))
    expect(gap).toMatchObject({ status: "ok", latestYear: 2025, changeVsPreviousYear: null })
    const [next] = getReductionNeeded(datasetOf([tubeOf("next", { 2024: 30, 2025: 25 })]))
    expect(next).toMatchObject({ status: "ok", changeVsPreviousYear: -5 })
  })

  it("needs no reduction once at or below the target, or after the target year", () => {
    const rows = getReductionNeeded(datasetOf([tubeOf("below", { 2025: 20 }), tubeOf("above", { 2025: 30 })]))
    expect(rows.map((r) => (r.status === "ok" ? r.reduction : "no-data"))).toEqual([{ kind: "at-or-below" }, { kind: "needed", perYear: 2 }])
    const aboveTargetInTheTargetYear = tubeOf("late", { 2030: 30 })
    expect(getReductionNeeded(datasetOf([aboveTargetInTheTargetYear]))[0]).toMatchObject({
      reduction: { kind: "deadline-reached" },
    })
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
    expect(classifyNo2(value)).toBe(band)
  })
})

describe("getReductionNeeded on the real Esch tubes", () => {
  beforeAll(stubFetchWithFixtures)

  it("gives each tube's distance to the 2030 value and the cut it needs per year", async () => {
    const rows = getReductionNeeded(await loadEschTubes()).map((r) =>
      r.status === "ok" ? [r.tubeId, r.latestYear, r.latestValue, r.pctVsTarget, r.changeVsPreviousYear, r.reduction] : [r.tubeId, r.status],
    )
    expect(rows).toEqual([
      ["kennedy", 2025, 27, 35, 0, { kind: "needed", perYear: 1.4 }],
      ["rue-de-luxembourg", 2025, 22, 10, 1, { kind: "needed", perYear: 0.4 }],
      ["neudorf", 2025, 23, 15, -1, { kind: "needed", perYear: 0.6 }],
      ["useldinger", 2025, 16, -20, 2, { kind: "at-or-below" }],
    ])
  })
})
