import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { summarizeStation, type Reading } from "@/domain/air-quality"
import { POLLUTANT_LIMITS } from "@/domain/limits"

const no2 = POLLUTANT_LIMITS.no2
const at = (hour: number) => new Date(Date.UTC(2026, 10, 8, hour))
const reading = (hour: number, value: number, unit = "µg/m³"): Reading => ({ at: at(hour), value, unit })

describe("summarizeStation", () => {
  it("averages the period, or takes the latest reading in latest mode", () => {
    const points = [reading(8, 10), reading(9, 30), reading(10, 50)]
    expect(summarizeStation(points, no2, "average")).toEqual({
      status: "ok",
      value: 30,
      count: 3,
      latestAt: at(10),
      limitStatus: "above-2030",
      droppedOtherUnit: 0,
    })
    expect(summarizeStation(points, no2, "latest")).toMatchObject({ value: 50, limitStatus: "above-today" })
  })

  it("leaves out and counts readings in another unit", () => {
    const summary = summarizeStation([reading(8, 10), reading(9, 0.02, "ppm")], no2, "latest")
    expect(summary).toMatchObject({ status: "ok", value: 10, count: 1, latestAt: at(8), droppedOtherUnit: 1 })
  })

  it("reports no data, still counting what it dropped", () => {
    expect(summarizeStation([], no2, "average")).toEqual({ status: "no-data", droppedOtherUnit: 0 })
    expect(summarizeStation([reading(8, 0.02, "ppm")], no2, "average")).toEqual({ status: "no-data", droppedOtherUnit: 1 })
  })

  it("accounts for every reading: count + dropped = input", () => {
    const arbitraryReading = fc.record({
      at: fc.integer({ min: 0, max: 48 }).map(at),
      value: fc.double({ min: 0, max: 200, noNaN: true }),
      unit: fc.constantFrom("µg/m³", "ppm"),
    })
    fc.assert(
      fc.property(fc.array(arbitraryReading), fc.constantFrom("latest" as const, "average" as const), (points, mode) => {
        const summary = summarizeStation(points, no2, mode)
        const counted = summary.status === "ok" ? summary.count : 0
        expect(counted + summary.droppedOtherUnit).toBe(points.length)
      }),
    )
  })
})
