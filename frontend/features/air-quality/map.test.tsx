import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { FakeMap } from "@/test/fake-map"
import { ESCH_ALZETTE } from "@/test/esch"
import { useStationLayers } from "./map"
import type { Map as MapboxMap } from "mapbox-gl"

const STATION_LAYER_ID = "air-quality-stations"

describe("useStationLayers", () => {
  it("sets the hover size on the map, not in React state, so hovering a marker doesn't re-render the page", () => {
    const map = new FakeMap()
    let renders = 0
    renderHook(() => {
      renders += 1
      useStationLayers(map as unknown as MapboxMap, [ESCH_ALZETTE])
    })
    const rendersBeforeHover = renders
    map.pointer("mouseenter", STATION_LAYER_ID)
    expect(map.paint[STATION_LAYER_ID]?.["circle-radius"]).toBe(12)
    map.pointer("mouseleave", STATION_LAYER_ID)
    expect(map.paint[STATION_LAYER_ID]?.["circle-radius"]).toBe(10)
    expect(renders).toBe(rendersBeforeHover)
  })
})
