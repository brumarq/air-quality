import { describe, expect, it } from "vitest"
import { NO2_LIMITS } from "@/domain/limits"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { tokens } from "@/theme/tokens"
import { no2TubesGeoJson } from "./no2-tube-layers"

const tube = (id: string, readings: { year: number; value: number }[]) => ({
  id,
  name: id,
  tubeIds: [],
  lat: 49.5,
  lng: 5.98,
  approximateLocation: false,
  readings,
})

const dataset: No2TubeDataset = {
  commune: "test",
  unit: "µg/m³",
  method: "",
  campaignYears: [2025],
  sources: [],
  tubes: [tube("over", [{ year: 2025, value: 27 }]), tube("none", [])],
}

describe("no2TubesGeoJson", () => {
  it("colours each pin by its latest reading's band, grey without one", () => {
    const { features } = no2TubesGeoJson(dataset, NO2_LIMITS)
    expect(features.map((f) => f.properties)).toEqual([
      { id: "over", name: "over", color: tokens.no2.band.above2030 },
      { id: "none", name: "none", color: tokens.no2.markerNoData },
    ])
    expect(features[0]?.geometry.coordinates).toEqual([5.98, 49.5])
  })
})
