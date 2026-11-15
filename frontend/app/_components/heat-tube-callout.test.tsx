import { beforeAll, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { HeatMapData } from "@/features/heat/model"
import type { No2TubeDataset } from "@/features/no2-tubes/model"
import { HeatTubeCallout } from "./heat-tube-callout"
import { ESCH_SUR_ALZETTE } from "@/content/communes/esch-sur-alzette"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { loadEschHeat, loadEschTubes } from "@/test/esch"

const callout = { label: "Main Street", studyPointName: "Main Street", tubeId: "main", heatText: "a heat hotspot in the study" }

const heat: HeatMapData = {
  years: [],
  cells: [],
  gridGeoJson: { type: "FeatureCollection", features: [] },
  buildingsGeoJson: { type: "FeatureCollection", features: [] },
  boundary: { type: "Feature", properties: null, geometry: { type: "Polygon", coordinates: [] } },
  buildings: [],
  stats: [],
  studyComparison: {
    method: "",
    points: [{ name: "Main Street", studySays: "hot", tempC: 37, approximate: false, lngLat: [0, 0] }],
    coldestHotPointC: 37,
    warmestCoolPointC: 36,
    cleanSeparation: true,
  },
}

const tubesAt = (value: number): No2TubeDataset => ({
  campaignYears: [2025],
  tubes: [{ id: "main", name: "Main", lat: 0, lng: 0, approximateLocation: false, readings: [{ year: 2025, value }] }],
})

type Callout = typeof callout
const calloutText = (c: Callout, h: HeatMapData, tubes: No2TubeDataset | null) =>
  render(<HeatTubeCallout callout={c} heat={h} tubes={tubes} />).container.textContent

describe("HeatTubeCallout", () => {
  it("says how far above the target the tube still is", () => {
    expect(calloutText(callout, heat, tubesAt(27))).toBe("Main Street: a heat hotspot in the study, and NO₂ still +35% above the 2030 value.")
  })

  it("stays hidden once the tube is at or below the target, since the copy says \"still above\"", () => {
    expect(calloutText(callout, heat, tubesAt(18))).toBe("")
    expect(calloutText(callout, heat, tubesAt(20))).toBe("")
  })

  it("stays hidden without the study point or the tube data", () => {
    expect(calloutText({ ...callout, studyPointName: "Elsewhere" }, heat, tubesAt(27))).toBe("")
    expect(calloutText(callout, heat, null)).toBe("")
  })
})

describe("HeatTubeCallout on the real Esch content and data", () => {
  beforeAll(stubFetchWithFixtures)

  it("finds the study point and tube the content names", async () => {
    const content = ESCH_SUR_ALZETTE.heatTubeCallout
    if (!content) throw new Error("Esch has no heat-tube callout")
    const text = calloutText(content, await loadEschHeat(), await loadEschTubes())
    expect(text).toBe(`${content.label}: ${content.heatText}, and NO₂ still +35% above the 2030 value.`)
  })
})
