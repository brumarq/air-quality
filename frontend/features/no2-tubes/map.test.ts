import { describe, expect, it } from "vitest"
import type { No2TubeDataset } from "./model"
import { tokens } from "@/shared/theme/tokens"
import { no2TubesGeoJson } from "./map"

const tube = (id: string, readings: { year: number; value: number }[]) => ({
  id,
  name: id,
  lat: 49.5,
  lng: 5.98,
  approximateLocation: false,
  readings,
})

const dataset: No2TubeDataset = {
  campaignYears: [2025],
  tubes: [tube("over", [{ year: 2025, value: 27 }]), tube("none", [])],
}

describe("no2TubesGeoJson", () => {
  it("colours each pin by its latest reading's band, grey without one", () => {
    const { features } = no2TubesGeoJson(dataset)
    expect(features.map((f) => f.properties)).toEqual([
      { id: "over", name: "over", color: tokens.no2.band.above2030 },
      { id: "none", name: "none", color: tokens.no2.markerNoData },
    ])
    expect(features[0]?.geometry.coordinates).toEqual([5.98, 49.5])
  })
})
