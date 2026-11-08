// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { loadEschTubes } from "@/test/esch"
import { NO2_LIMITS } from "@/domain/limits"
import { NO2ReductionCard } from "@/features/no2-tubes/no2-reduction-card"

describe("NO2ReductionCard on the real Esch data (characterization)", () => {
beforeAll(stubFetchWithFixtures)

  it("renders the reduction table", async () => {
    const esch = await loadEschTubes()
    const text = render(<NO2ReductionCard dataset={esch} limits={NO2_LIMITS} selectedTubeId={null} onSelectTube={() => {}} />).container.textContent
    expect(text).toMatchSnapshot()
  })
})
