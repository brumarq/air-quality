"use client"

import { useMemo } from "react"
import type { LayerSpecification } from "mapbox-gl"
import type { LngLat } from "@/shared/domain/geo"
import { tokens } from "@/shared/theme/tokens"
import { useMapLayer, type MapLike } from "@/shared/map/use-map-layer"

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
