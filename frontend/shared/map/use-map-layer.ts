"use client"

import { useEffect, useRef } from "react"
import type {
  GeoJSONSourceSpecification,
  LayerSpecification,
  MapMouseEvent,
  RasterSourceSpecification,
} from "mapbox-gl"

export type LayerEventType = "click" | "mouseenter" | "mouseleave" | "mousemove"
export type LayerEvent = Pick<MapMouseEvent, "features">
export type LayerEventHandlers = Partial<Record<LayerEventType, (event: LayerEvent) => void>>
export type MapSourceSpec = GeoJSONSourceSpecification | RasterSourceSpecification

export interface MapLike {
  getSource(id: string): object | undefined
  addSource(id: string, source: MapSourceSpec): unknown
  removeSource(id: string): unknown
  getLayer(id: string): object | undefined | null
  getCanvas(): { style: { cursor: string } }
  addLayer(layer: LayerSpecification): unknown
  removeLayer(id: string): unknown
  setPaintProperty(layerId: string, name: string, value: unknown): unknown
  on(type: LayerEventType, layerId: string, listener: (event: LayerEvent) => void): unknown
  off(type: LayerEventType, layerId: string, listener: (event: LayerEvent) => void): unknown
  on(type: "style.load" | "remove", listener: () => void): unknown
  off(type: "style.load" | "remove", listener: () => void): unknown
}

export interface MapLayerConfig<D> {
  sourceId: string
  data: D | null
  source: (data: D) => MapSourceSpec
  layers: readonly LayerSpecification[]
  paint?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  events?: Readonly<Record<string, LayerEventHandlers>>
}

const LAYER_EVENTS: readonly LayerEventType[] = ["click", "mouseenter", "mouseleave", "mousemove"]

function applyPaint(map: MapLike, paint: MapLayerConfig<unknown>["paint"]) {
  for (const [layerId, properties] of Object.entries(paint ?? {})) {
    if (!map.getLayer(layerId)) continue
    for (const [name, value] of Object.entries(properties)) map.setPaintProperty(layerId, name, value)
  }
}

function hasSetData(source: object): source is { setData: (data: GeoJSONSourceSpecification["data"]) => unknown } {
  return "setData" in source && typeof source.setData === "function"
}

export function useMapLayer<D>(map: MapLike | null, config: MapLayerConfig<D>) {
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  })

  const { sourceId, data } = config
  const enabled = data !== null
  const layerIds = config.layers.map((layer) => layer.id).join("\n")
  const paintKey = JSON.stringify(config.paint ?? {})

  useEffect(() => {
    if (!map || !enabled) return
    let mapRemoved = false

    const listeners = configRef.current.layers.flatMap((layer) =>
      LAYER_EVENTS.map((type) => ({
        type,
        layerId: layer.id,
        listener: (event: LayerEvent) => configRef.current.events?.[layer.id]?.[type]?.(event),
      })),
    )

    const add = () => {
      const current = configRef.current
      if (current.data === null) return
      if (!map.getSource(sourceId)) map.addSource(sourceId, current.source(current.data))
      for (const layer of current.layers) {
        if (!map.getLayer(layer.id)) map.addLayer(layer)
      }
      applyPaint(map, current.paint)
    }

    const markRemoved = () => {
      mapRemoved = true
    }

    add()
    for (const { type, layerId, listener } of listeners) map.on(type, layerId, listener)
    map.on("style.load", add)
    map.on("remove", markRemoved)

    return () => {
      map.off("style.load", add)
      map.off("remove", markRemoved)
      for (const { type, layerId, listener } of listeners) map.off(type, layerId, listener)
      if (mapRemoved) return
      if (Object.keys(configRef.current.events ?? {}).length > 0) map.getCanvas().style.cursor = ""
      for (const layer of configRef.current.layers.toReversed()) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id)
      }
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }, [map, enabled, sourceId, layerIds])

  useEffect(() => {
    if (!map || data === null) return
    const existing = map.getSource(sourceId)
    const spec = configRef.current.source(data)
    if (existing && spec.type === "geojson" && hasSetData(existing)) existing.setData(spec.data)
  }, [map, sourceId, data])

  useEffect(() => {
    if (!map || !enabled) return
    applyPaint(map, configRef.current.paint)
  }, [map, enabled, paintKey])
}
