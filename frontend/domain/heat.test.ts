import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { buildHeatStory, type BuildingKind, type HeatMapData, type HeatYearStats } from "@/domain/heat"

const KINDS: BuildingKind[] = ["school", "kindergarten", "care_facility"]

function yearStats(year: number, buildings: { osmId: string; name: string | null }[]): HeatYearStats {
  return {
    year,
    communeMeanC: 30,
    hottest10pctThresholdAnomalyC: 6,
    hottest10pctCellCount: 10,
    hottestCellIds: [],
    sensitiveBuildingsInHottest10pct: buildings.map((b, i) => ({ ...b, kind: KINDS[i % 3] ?? "school" })),
    industrialMaxAnomalyC: null,
    industrialCellCount: 0,
    hottestNonIndustrial: null,
  }
}

function dataOf(stats: HeatYearStats[], buildingCount = 30): HeatMapData {
  return {
    years: stats.map((s) => s.year),
    cells: [],
    boundary: { type: "Feature", properties: null, geometry: { type: "Polygon", coordinates: [] } },
    buildings: Array.from({ length: buildingCount }, (_, i) => ({
      osmId: `b${i}`,
      name: null,
      kind: "school" as const,
      nearestCellId: "c",
      lngLat: [0, 0] as const,
    })),
    stats,
    studyComparison: null,
  }
}

const building = fc.record({ osmId: fc.constantFrom("b1", "b2", "b3", "b4", "b5", "b6"), name: fc.option(fc.constantFrom("School A", "School B", "Crèche"), { nil: null }) })

describe("buildHeatStory", () => {
  it("counts each building once, unnamed ones included, and shows the named ones most often hottest", () => {
    const story = buildHeatStory(
      dataOf([
        yearStats(2024, [{ osmId: "a", name: "Lycée A" }, { osmId: "u1", name: null }, { osmId: "u2", name: null }]),
        yearStats(2025, [{ osmId: "a", name: "Lycée A" }, { osmId: "b", name: "École B" }, { osmId: "c", name: "École C" }]),
      ]),
    )
    expect(story.sensitiveBuildings).toEqual({
      everInHottest: 5,
      total: 30,
      shown: [
        { osmId: "a", name: "Lycée A", summers: 2 },
        { osmId: "b", name: "École B", summers: 1 },
      ],
      remaining: 3,
    })
    expect(story.years).toEqual({ first: 2024, last: 2025, count: 2 })
  })

  it("keeps shown + remaining === everInHottest for any data", () => {
    fc.assert(
      fc.property(fc.array(fc.uniqueArray(building, { selector: (b) => b.osmId, maxLength: 6 }), { maxLength: 5 }), (perYear) => {
        const { sensitiveBuildings: s } = buildHeatStory(dataOf(perYear.map((b, i) => yearStats(2021 + i, b))))
        expect(s.shown.length + s.remaining).toBe(s.everInHottest)
        expect(s.shown.length).toBeLessThanOrEqual(2)
      }),
    )
  })

  it("has no years and no hottest spot without data", () => {
    const story = buildHeatStory(dataOf([], 0))
    expect(story.years).toBeNull()
    expect(story.hottestSpot).toBeNull()
  })
})
