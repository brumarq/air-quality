import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import type { LayerSpecification, Map as MapboxMap } from "mapbox-gl"
import { useMapLayer, type MapLayerConfig, type MapLike } from "./use-map-layer"
import { FakeMap } from "@/test/fake-map"

export const realMapSatisfiesMapLikeWithoutCast = (map: MapboxMap): MapLike => map

const LAYERS: LayerSpecification[] = [
  { id: "dots-fill", type: "circle", source: "dots" },
  { id: "dots-label", type: "symbol", source: "dots" },
]

const geojson = (n: number): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: Array.from({ length: n }, () => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } })),
})

function setup(initial: Partial<MapLayerConfig<GeoJSON.FeatureCollection>> = {}) {
  const map = new FakeMap()
  const base: MapLayerConfig<GeoJSON.FeatureCollection> = {
    sourceId: "dots",
    data: geojson(1),
    source: (data) => ({ type: "geojson", data }),
    layers: LAYERS,
    ...initial,
  }
  const hook = renderHook((config: MapLayerConfig<GeoJSON.FeatureCollection>) => useMapLayer(map, config), {
    initialProps: base,
  })
  return { map, base, ...hook }
}

describe("useMapLayer", () => {
  it("adds the source and layers in order", () => {
    const { map } = setup()
    expect([...map.sources.keys()]).toEqual(["dots"])
    expect(map.layers.map((l) => l.id)).toEqual(["dots-fill", "dots-label"])
  })

  it("treats data === null as off, and removes everything when it turns off", () => {
    const { map, base, rerender } = setup({ data: null })
    expect(map.sources.size).toBe(0)

    rerender({ ...base, data: geojson(2) })
    expect(map.layers).toHaveLength(2)

    rerender({ ...base, data: null })
    expect(map.sources.size).toBe(0)
    expect(map.layers).toHaveLength(0)
    expect(map.layerListeners).toHaveLength(0)
  })

  it("updates GeoJSON data in place without re-adding the layers", () => {
    const { map, base, rerender } = setup()
    const firstLayer = map.layers[0]
    const next = geojson(3)
    rerender({ ...base, data: next })
    expect(map.sources.get("dots")?.data).toBe(next)
    expect(map.layers[0]).toBe(firstLayer)
  })

  it("applies paint on add and again when it changes", () => {
    const { map, base, rerender } = setup({ paint: { "dots-fill": { "circle-radius": 4 } } })
    expect(map.paint["dots-fill"]).toEqual({ "circle-radius": 4 })
    rerender({ ...base, paint: { "dots-fill": { "circle-radius": 8 } } })
    expect(map.paint["dots-fill"]).toEqual({ "circle-radius": 8 })
  })

  it("calls the latest handler without re-registering listeners", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { map, base, rerender } = setup({ events: { "dots-fill": { click: first } } })
    const registered = map.layerListeners.length

    rerender({ ...base, events: { "dots-fill": { click: second } } })
    map.click("dots-fill")

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(map.layerListeners).toHaveLength(registered)
  })

  it("builds changed data with this render's source function, since the config ref updates before the other effects", () => {
    const { map, base, rerender } = setup()
    const marked = geojson(2)
    rerender({ ...base, data: marked, source: (data) => ({ type: "geojson", data: { ...data, features: data.features.slice(0, 1) } }) })
    expect(map.sources.get("dots")?.data).toEqual({ ...marked, features: marked.features.slice(0, 1) })
  })

  it("re-adds its source, layers and paint after a style reload", () => {
    const { map } = setup({ paint: { "dots-fill": { "circle-radius": 4 } } })
    map.paint = {}
    map.reloadStyle()
    expect([...map.sources.keys()]).toEqual(["dots"])
    expect(map.layers.map((l) => l.id)).toEqual(["dots-fill", "dots-label"])
    expect(map.paint["dots-fill"]).toEqual({ "circle-radius": 4 })
  })

  it("removes everything and its listeners on unmount, even after the handlers changed", () => {
    const { map, base, rerender, unmount } = setup({ events: { "dots-fill": { click: vi.fn() } } })
    rerender({ ...base, events: { "dots-fill": { click: vi.fn() } } })
    unmount()
    expect(map.sources.size).toBe(0)
    expect(map.layers).toHaveLength(0)
    expect(map.layerListeners).toHaveLength(0)
    expect(map.mapListeners).toHaveLength(0)
  })

  it("resets the cursor when a layer with handlers is removed under the pointer, since it never gets its mouseleave", () => {
    const { map, base, rerender } = setup({ events: { "dots-fill": { mouseenter: vi.fn() } } })
    map.canvas.style.cursor = "pointer"
    rerender({ ...base, events: { "dots-fill": { mouseenter: vi.fn() } }, data: null })
    expect(map.canvas.style.cursor).toBe("")
  })

  it("doesn't touch a map that was already removed", () => {
    const { map, unmount } = setup()
    map.remove()
    expect(() => unmount()).not.toThrow()
  })

  it("does nothing while the map is null", () => {
    expect(() => renderHook(() => useMapLayer(null, { sourceId: "x", data: geojson(1), source: (data) => ({ type: "geojson", data }), layers: LAYERS }))).not.toThrow()
  })
})
