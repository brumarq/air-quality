import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { tokens } from "@/shared/theme/tokens"
import { FakeMap } from "@/test/fake-map"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { DEFAULT_HEAT_LAYER_TOGGLES } from "./model"
import { HEAT_BUILDINGS_LAYERS, useHeatMapLayers } from "./map"
import type { Map as MapboxMap } from "mapbox-gl"

describe("building markers", () => {
  it("colour each building kind, and anything else grey", () => {
    const [layer] = HEAT_BUILDINGS_LAYERS
    expect(layer?.type === "circle" && layer.paint?.["circle-color"]).toEqual([
      "match",
      ["get", "kind"],
      "school",
      tokens.heat.building.school,
      "kindergarten",
      tokens.heat.building.kindergarten,
      "care_facility",
      tokens.heat.building.careFacility,
      tokens.heat.building.other,
    ])
  })
})

const toggles = { ...DEFAULT_HEAT_LAYER_TOGGLES, studyOverlay: true }
const studyOverlay = { label: "Study", hint: "", attribution: "", wmsUrl: "https://wms.example.test/service", wmsLayer: "1" }

function renderHeatLayers(props: Partial<Parameters<typeof useHeatMapLayers>[0]> = {}) {
  const map = new FakeMap()
  const hook = renderHook(() =>
    useHeatMapLayers({ map: map as unknown as MapboxMap, communeSlug: "esch-sur-alzette", studyOverlay, visible: true, pickedYear: null, toggles, ...props }),
  )
  return { map, ...hook }
}

describe("useHeatMapLayers", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("promotes the cell id on the grid source, so the hover outline's feature-state can key off it", async () => {
    stubFetchWithFixtures()
    const { map, result } = renderHeatLayers()
    await waitFor(() => expect(result.current.data).not.toBeNull())
    const grid = map.sources.get("heat-grid-data")?.spec
    expect(grid?.type === "geojson" && grid.promoteId).toBe("id")
  })

  it("keeps {bbox-epsg-3857} unescaped in the study overlay's tile URL, since Mapbox fills it in per tile", () => {
    const { map } = renderHeatLayers({ communeSlug: null })
    const overlay = map.sources.get("heat-study-overlay-data")?.spec
    expect(overlay?.type === "raster" && overlay.tiles?.[0]).toMatch(/&BBOX=\{bbox-epsg-3857\}$/)
  })

  it("draws the study overlay without waiting for the heat data, since its tiles come from the commune's WMS", () => {
    const { map } = renderHeatLayers({ communeSlug: null })
    expect(map.sources.has("heat-study-overlay-data")).toBe(true)
  })

  it("doesn't fetch the heat files until heat mode is shown, since the grid alone is ~800 KB", () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    renderHeatLayers({ communeSlug: "not-loaded-before", visible: false })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
