import { describe, expect, it } from "vitest"
import { beforeAll } from "vitest"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { loadEschTubes } from "@/test/esch"
import { NO2_LIMITS } from "@/domain/limits"
import { getReductionNeeded } from "@/domain/no2-tubes"

beforeAll(stubFetchWithFixtures)

describe("NO2 tubes on the real Esch data (characterization)", () => {
  it("lists the campaign years", async () => {
    expect((await loadEschTubes()).campaignYears).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
  })

  it("computes the reduction each tube needs", async () => {
    expect(getReductionNeeded(await loadEschTubes(), NO2_LIMITS)).toMatchSnapshot()
  })
})
