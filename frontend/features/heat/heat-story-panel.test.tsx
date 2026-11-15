import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import fc from "fast-check"
import type { BuildingKind, HeatMapData, HeatYearStats, StudyComparisonPoint } from "./model"
import { HeatStoryPanel, hotspotBarPct, rankSensitiveBuildings, splitHotspots, studyStatus } from "./heat-story-panel"

const KINDS: BuildingKind[] = ["school", "kindergarten", "care_facility"]

function yearStats(year: number, buildings: { osmId: string; name: string | null }[]): HeatYearStats {
  return {
    year,
    communeMeanC: 30,
    hottest10pctCellCount: 10,
    hottestCellIds: [],
    sensitiveBuildingsInHottest10pct: buildings.map((b, i) => ({ ...b, kind: KINDS[i % 3] ?? "school" })),
    hottestNonIndustrial: null,
  }
}

function dataOf(stats: HeatYearStats[], buildingCount = 30): HeatMapData {
  return {
    years: stats.map((s) => s.year),
    cells: [],
    gridGeoJson: { type: "FeatureCollection", features: [] },
    buildingsGeoJson: { type: "FeatureCollection", features: [] },
    boundary: { type: "Feature", properties: null, geometry: { type: "Polygon", coordinates: [] } },
    buildings: Array.from({ length: buildingCount }, (_, i) => ({
      osmId: `b${i}`,
      name: null,
      kind: "school" as const,
      nearestCellId: "c",
    })),
    stats,
    studyComparison: null,
  }
}

const building = fc.record({ osmId: fc.constantFrom("b1", "b2", "b3", "b4", "b5", "b6"), name: fc.option(fc.constantFrom("School A", "School B", "Crèche"), { nil: null }) })

const panelText = (data: HeatMapData) =>
  render(<HeatStoryPanel data={data} communeName="Esch" study={null} onFlyTo={() => {}} industryNote={null} />).container.textContent ?? ""

describe("rankSensitiveBuildings", () => {
  const data = dataOf([
    yearStats(2024, [{ osmId: "a", name: "Lycée A" }, { osmId: "u1", name: null }, { osmId: "u2", name: null }]),
    yearStats(2025, [{ osmId: "a", name: "Lycée A" }, { osmId: "b", name: "École B" }, { osmId: "c", name: "École C" }]),
  ])

  it("counts each building once by OSM id, so two unnamed facilities don't merge, and shows the named ones most often hottest", () => {
    expect(rankSensitiveBuildings(data)).toEqual({
      everInHottest: 5,
      shown: [
        { osmId: "a", name: "Lycée A", summers: 2 },
        { osmId: "b", name: "École B", summers: 1 },
      ],
      remaining: 3,
    })
  })

  it("shows the count, the total and the summers in the panel", () => {
    const text = panelText(data)
    expect(text).toContain("5 of 30")
    expect(text).toContain("Lycée A (2 of 2 summers), École B (1 of 2 summers), +3 more")
    expect(text).toContain("observed by satellite since 2024")
  })

  it("keeps shown + remaining === everInHottest for any data", () => {
    fc.assert(
      fc.property(fc.array(fc.uniqueArray(building, { selector: (b) => b.osmId, maxLength: 6 }), { maxLength: 5 }), (perYear) => {
        const s = rankSensitiveBuildings(dataOf(perYear.map((b, i) => yearStats(2021 + i, b))))
        expect(s.shown.length + s.remaining).toBe(s.everInHottest)
        expect(s.shown.length).toBeLessThanOrEqual(2)
      }),
    )
  })

  it("leaves out the first year and the hottest spot's value and year without data", () => {
    const text = panelText(dataOf([], 0))
    expect(text).toContain("observed by satellite since —Hottest public/residential spot, 0 of 0")
  })
})

describe("studyStatus", () => {
  const content = {
    agreesTitle: "",
    introBefore: "",
    reportTitle: "",
    introAfter: () => "",
    reportUrl: "",
    reportLinkLabel: "",
    disagreesText: () => "",
    notComparedText: "",
    methodNote: "",
  }
  const comparison = (cleanSeparation: boolean) => ({ method: "", points: [], coldestHotPointC: 0, warmestCoolPointC: 0, cleanSeparation })

  it("is null for a commune without a study, even if a comparison file exists", () => {
    expect(studyStatus(comparison(true), null)).toBeNull()
  })

  it("agrees, disagrees, or isn't compared yet", () => {
    expect(studyStatus(comparison(true), content)?.status).toBe("agrees")
    expect(studyStatus(comparison(false), content)?.status).toBe("disagrees")
    expect(studyStatus(null, content)?.status).toBe("not-compared")
  })
})

const point = (name: string, studySays: "hot" | "cool", tempC: number): StudyComparisonPoint => ({
  name,
  studySays,
  tempC,
  approximate: false,
  lngLat: [0, 0],
})

describe("the hotspot list", () => {
  it("groups warmest first and scales bars to the padded range", () => {
    const points = [point("a", "hot", 40), point("b", "cool", 34), point("c", "hot", 37)]
    expect(splitHotspots(points).hot.map((p) => p.name)).toEqual(["a", "c"])
    const barPctOnPaddedScale33To41 = hotspotBarPct(points)
    expect(barPctOnPaddedScale33To41(40)).toBe(87.5)
    expect(barPctOnPaddedScale33To41(34)).toBe(12.5)
  })

  it("handles no points", () => {
    expect(splitHotspots([])).toEqual({ hot: [], cool: [] })
    expect(hotspotBarPct([])(30)).toBe(0)
  })
})
