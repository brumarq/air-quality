import { describe, expect, it } from "vitest"
import { No2TubeDatasetSchema } from "@/api/no2-tubes"

const file = (overrides: Record<string, unknown> = {}) => ({
  commune: "test",
  pollutant: "no2",
  unit: "µg/m³",
  limitToday: 40,
  limit2030: 20,
  method: "",
  sources: {
    "2025": { title: "2025", url: "https://example.org/2025.pdf", page: 7 },
    "2024": { title: "2024", url: "https://example.org/2024.pdf", page: 11 },
  },
  tubes: [{ id: "t", name: "T", tubeIds: [], lat: 0, lng: 0, approximateLocation: false, readings: { "2025": 27, "2024": null } }],
  ...overrides,
})

describe("No2TubeDatasetSchema", () => {
  it("turns year-keyed records into arrays sorted by year, dropping missing readings", () => {
    const parsed = No2TubeDatasetSchema.parse(file())
    expect(parsed.campaignYears).toEqual([2024, 2025])
    expect(parsed.sources.map((s) => s.year)).toEqual([2024, 2025])
    expect(parsed.tubes[0]?.readings).toEqual([{ year: 2025, value: 27 }])
  })

  it("rejects a file prepared against other limits than the app's", () => {
    expect(No2TubeDatasetSchema.safeParse(file({ limit2030: 25 })).success).toBe(false)
  })

  it("rejects a reading for a year with no source report", () => {
    const tubes = [{ id: "t", name: "T", tubeIds: [], lat: 0, lng: 0, approximateLocation: false, readings: { "2019": 30 } }]
    expect(No2TubeDatasetSchema.safeParse(file({ tubes })).success).toBe(false)
  })
})
