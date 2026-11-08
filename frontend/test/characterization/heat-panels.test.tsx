// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { HeatMapCard } from "@/features/heat/heat-map-card"
import { HeatStoryPanel } from "@/features/heat/heat-story-panel"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { loadEschHeat, loadEschTubes } from "@/test/esch"

beforeAll(stubFetchWithFixtures)

const toggles = { grid: true, ndvi: false, buildings: true, studyOverlay: false }
const studyOverlay = { label: "PRO-SUD study map", hint: "Their own modelled layer", attribution: "© Administration du Cadastre et de la Topographie / Geoportail.lu for the PRO-SUD layer.", wmsUrl: "https://example.org/wms", wmsLayer: "2922" }

describe("heat panels on the real Esch data (characterization)", () => {
  it("renders the story panel", async () => {
    const data = await loadEschHeat()
    const tubes = await loadEschTubes()
    const text = render(<HeatStoryPanel data={data} communeName="Esch-sur-Alzette" tubeDataset={tubes} onFlyTo={() => {}} />).container.textContent
    expect(text).toMatchSnapshot()
  })

  it.each([2022, 2023, 2024, 2025])("renders the map card for %i", async (year) => {
    const data = await loadEschHeat()
    const text = render(<HeatMapCard data={data} studyOverlay={studyOverlay} year={year} onSelectYear={() => {}} toggles={toggles} onToggle={() => {}} />).container.textContent
    expect(text).toMatchSnapshot()
  })
})
