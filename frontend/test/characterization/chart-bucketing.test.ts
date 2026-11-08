import { beforeAll, describe, expect, it } from "vitest"
import { bucketTrend } from "@/domain/air-quality/chart-bucketing"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { eschNo2History } from "@/test/esch"

beforeAll(stubFetchWithFixtures)

describe("trend bucketing on real Esch NO2 readings (characterization)", () => {
  it("buckets the day range hourly", async () => {
    const { history, from, to } = await eschNo2History(1)
    const { axis, series } = bucketTrend(history, "hour", { from, to })
    expect(axis.map((d, i) => [d.toISOString(), series[0]?.points[i] ?? null])).toMatchSnapshot()
  })

  it("buckets the week range in 8-hour blocks", async () => {
    const { history, from, to } = await eschNo2History(7)
    const { axis, series } = bucketTrend(history, "eightHour", { from, to })
    expect(axis.map((d, i) => [d.toISOString(), series[0]?.points[i] ?? null])).toMatchSnapshot()
  })
})
