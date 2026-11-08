"use client"

import { useMemo } from "react"
import type { LayerSpecification } from "mapbox-gl"
import type { LngLat } from "@/domain/shared/geo"
import { tokens } from "@/theme/tokens"
import { useMapLayer, type MapLike } from "./use-map-layer"

const SOURCE_ID = "bounds-outline"
const LAYER_ID = "bounds-outline-line"

const LAYERS: LayerSpecification[] = [
  {
    id: LAYER_ID,
    type: "line",
    source: SOURCE_ID,
    paint: { "line-color": tokens.map.countryOutline, "line-width": 2, "line-opacity": 0.7 },
  },
]

/**
 * Outlines a rectangle given by its south-west and north-east corners. This is a
 * bounding box for orientation, not a border: it's drawn as a plain rectangle.
 */
export function useBoundsOutline(map: MapLike | null, [[west, south], [east, north]]: readonly [LngLat, LngLat]) {
  const data = useMemo<GeoJSON.Feature<GeoJSON.Polygon>>(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
      },
    }),
    [west, south, east, north],
  )
  useMapLayer(map, { sourceId: SOURCE_ID, data, source: (feature) => ({ type: "geojson", data: feature }), layers: LAYERS })
}
