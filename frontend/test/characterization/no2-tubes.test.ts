import { describe, expect, it } from "vitest"
import { getNo2TubeDataset } from "@/api/no2-tubes"
import { getReductionNeeded, getTubeYears } from "@/domain/no2-tubes"

const esch = getNo2TubeDataset("esch-sur-alzette")

describe("NO2 tubes on the real Esch data (characterization)", () => {
  it("lists the campaign years", () => {
    expect(esch && getTubeYears(esch)).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
  })

  it("computes the reduction each tube needs", () => {
    expect(esch && getReductionNeeded(esch)).toMatchSnapshot()
  })
})
