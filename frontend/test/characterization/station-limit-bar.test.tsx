// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import { StationLimitBar } from "@/features/air-quality/station-limit-bar"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { eschNo2History } from "@/test/esch"

beforeAll(stubFetchWithFixtures)

const no2 = POLLUTANT_LIMITS[0]

describe("StationLimitBar on real Esch NO2 readings (characterization)", () => {
  it.each([
    ["live", 1, true],
    ["day", 1, false],
    ["week", 7, false],
  ])("%s", async (_name, days, live) => {
    const { history } = await eschNo2History(days)
    const text = history.map(({ station, points }) =>
      no2 ? render(<StationLimitBar station={station} color="" points={points} limit={no2} live={live} />).container.textContent : "",
    )
    expect(text).toMatchSnapshot()
  })
})
