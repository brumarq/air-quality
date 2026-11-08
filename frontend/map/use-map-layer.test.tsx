// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import type { LayerSpecification, Map as MapboxMap } from "mapbox-gl"
import { useMapLayer, type LayerEvent, type LayerEventType, type MapLayerConfig, type MapLike, type MapSourceSpec } from "./use-map-layer"

// Compile-time check: the real map must satisfy MapLike without a cast.
export const realMapIsMapLike = (map: MapboxMap): MapLike => map

type Listener = (event: LayerEvent) => void
type FakeSource = { spec: MapSourceSpec; setData: (data: unknown) => void; data: unknown }

/** Just enough of a map to watch what the hook does to it. */
class FakeMap implements MapLike {
  sources = new Map<string, FakeSource>()
  layers: LayerSpecification[] = []
  paint: Record<string, Record<string, unknown>> = {}
  layerListeners: { type: LayerEventType; layerId: string; listener: Listener }[] = []
  mapListeners: { type: string; listener: () => void }[] = []
  removed = false

  getSource(id: string) {
    this.assertAlive()
    return this.sources.get(id)
  }
  addSource(id: string, spec: MapSourceSpec) {
    if (this.sources.has(id)) throw new Error(`source ${id} already exists`)
    const entry: FakeSource = {
      spec,
      data: spec.type === "geojson" ? spec.data : null,
      setData: (data: unknown) => {
        entry.data = data
      },
    }
    this.sources.set(id, entry)
  }
  removeSource(id: string) {
    if (this.layers.some((l) => "source" in l && l.source === id)) throw new Error(`source ${id} still in use`)
    this.sources.delete(id)
  }
  getLayer(id: string) {
    this.assertAlive()
    return this.layers.find((l) => l.id === id)
  }
  addLayer(layer: LayerSpecification) {
    if (this.getLayer(layer.id)) throw new Error(`layer ${layer.id} already exists`)
    this.layers.push(layer)
  }
  removeLayer(id: string) {
    this.layers = this.layers.filter((l) => l.id !== id)
  }
  setPaintProperty(layerId: string, name: string, value: unknown) {
    this.paint[layerId] = { ...this.paint[layerId], [name]: value }
  }
  on(type: string, layerOrListener: string | (() => void), maybeListener?: Listener) {
    if (typeof layerOrListener === "string" && maybeListener && isLayerEvent(type)) {
      this.layerListeners.push({ type, layerId: layerOrListener, listener: maybeListener })
    } else if (typeof layerOrListener === "function") {
      this.mapListeners.push({ type, listener: layerOrListener })
    }
  }
  off(type: string, layerOrListener: string | (() => void), maybeListener?: Listener) {
    this.layerListeners = this.layerListeners.filter((l) => !(l.type === type && l.listener === maybeListener))
    this.mapListeners = this.mapListeners.filter((l) => !(l.type === type && l.listener === layerOrListener))
  }

  fire(type: string) {
    for (const { listener } of this.mapListeners.filter((l) => l.type === type)) listener()
  }
  click(layerId: string) {
    for (const { listener } of this.layerListeners.filter((l) => l.type === "click" && l.layerId === layerId)) {
      listener({ features: [] })
    }
  }
  /** What a style reload does: everything we added is gone, then style.load fires. */
  reloadStyle() {
    this.sources.clear()
    this.layers = []
    this.fire("style.load")
  }
  remove() {
    this.removed = true
    this.fire("remove")
  }
  private assertAlive() {
    if (this.removed) throw new Error("map was removed")
  }
}

function isLayerEvent(type: string): type is LayerEventType {
  return ["click", "mouseenter", "mouseleave", "mousemove"].includes(type)
}

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

  it("re-adds its source, layers and paint after a style reload", () => {
    const { map } = setup({ paint: { "dots-fill": { "circle-radius": 4 } } })
    map.paint = {}
    map.reloadStyle()
    expect([...map.sources.keys()]).toEqual(["dots"])
    expect(map.layers.map((l) => l.id)).toEqual(["dots-fill", "dots-label"])
    expect(map.paint["dots-fill"]).toEqual({ "circle-radius": 4 })
  })

  it("removes everything and its listeners on unmount", () => {
    const { map, unmount } = setup({ events: { "dots-fill": { click: vi.fn() } } })
    unmount()
    expect(map.sources.size).toBe(0)
    expect(map.layers).toHaveLength(0)
    expect(map.layerListeners).toHaveLength(0)
    expect(map.mapListeners).toHaveLength(0)
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
