// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { getNo2TubeDataset } from "@/api/no2-tubes"
import { NO2ReductionCard } from "@/features/no2-tubes/no2-reduction-card"

describe("NO2ReductionCard on the real Esch data (characterization)", () => {
  it("renders the reduction table", () => {
    const esch = getNo2TubeDataset("esch-sur-alzette")
    const text = esch && render(<NO2ReductionCard dataset={esch} selectedTubeId={null} onSelectTube={() => {}} />).container.textContent
    expect(text).toMatchSnapshot()
  })
})
