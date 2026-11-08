// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { fetchHeatMapData } from "@/api/heat"
import { getNo2TubeDataset } from "@/api/no2-tubes"
import { HeatMapCard } from "@/features/heat/heat-map-card"
import { HeatStoryPanel } from "@/features/heat/heat-story-panel"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"

beforeAll(stubFetchWithFixtures)

const toggles = { grid: true, ndvi: false, buildings: true, prosudWms: false }

describe("heat panels on the real Esch data (characterization)", () => {
  it("renders the story panel", async () => {
    const data = await fetchHeatMapData("esch-sur-alzette")
    const tubes = getNo2TubeDataset("esch-sur-alzette")
    const text = data && render(<HeatStoryPanel data={data} communeName="Esch-sur-Alzette" tubeDataset={tubes} map={null} />).container.textContent
    expect(text).toMatchSnapshot()
  })

  it.each([2022, 2023, 2024, 2025])("renders the map card for %i", async (year) => {
    const data = await fetchHeatMapData("esch-sur-alzette")
    const text = data && render(<HeatMapCard stats={data.stats} year={year} onSelectYear={() => {}} toggles={toggles} onToggle={() => {}} />).container.textContent
    expect(text).toMatchSnapshot()
  })
})
