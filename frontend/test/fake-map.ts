import type { LayerSpecification } from "mapbox-gl"
import type { LayerEvent, LayerEventType, MapLike, MapSourceSpec } from "@/shared/map/use-map-layer"

type Listener = (event: LayerEvent) => void
type FakeSource = { spec: MapSourceSpec; setData: (data: unknown) => void; data: unknown }

export class FakeMap implements MapLike {
  sources = new Map<string, FakeSource>()
  layers: LayerSpecification[] = []
  paint: Record<string, Record<string, unknown>> = {}
  layerListeners: { type: LayerEventType; layerId: string; listener: Listener }[] = []
  mapListeners: { type: string; listener: () => void }[] = []
  removed = false
  canvas = { style: { cursor: "" } }

  getCanvas() {
    return this.canvas
  }

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
    this.pointer("click", layerId)
  }
  pointer(type: LayerEventType, layerId: string, event: LayerEvent = { features: [] }) {
    for (const { listener } of this.layerListeners.filter((l) => l.type === type && l.layerId === layerId)) listener(event)
  }
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
