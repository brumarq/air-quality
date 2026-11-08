import { beforeAll, describe, expect, it } from "vitest"
import { bucketTrendData } from "@/domain/chart-bucketing"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { eschNo2History } from "@/test/esch"

beforeAll(stubFetchWithFixtures)

describe("trend bucketing on real Esch NO2 readings (characterization)", () => {
  it("buckets the day range hourly", async () => {
    const { history, from, to } = await eschNo2History(1)
    const { rows } = bucketTrendData(history, "day", from, to)
    expect(rows.map((r) => [r.timestamp, r["Esch/Alzette"] ?? null])).toMatchSnapshot()
  })

  it("buckets the week range in 8-hour blocks", async () => {
    const { history, from, to } = await eschNo2History(7)
    const { rows } = bucketTrendData(history, "week", from, to)
    expect(rows.map((r) => [r.timestamp, r["Esch/Alzette"] ?? null])).toMatchSnapshot()
  })
})
