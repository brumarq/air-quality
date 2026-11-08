"use client"

import { useMemo, useState } from "react"
import type mapboxgl from "mapbox-gl"
import type { No2Limits } from "@/domain/limits"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { featureProperties } from "@/map/feature-properties"
import { useMapLayer } from "@/map/use-map-layer"
import { NO2_TUBE_LAYER_ID, NO2_TUBE_LAYERS, NO2_TUBE_SOURCE_ID, TubeFeatureProperties, no2TubesGeoJson } from "./no2-tube-layers"

interface UseNo2TubeMarkersProps {
  map: mapboxgl.Map | null
  dataset: No2TubeDataset | null
  limits: No2Limits
  visible: boolean
}

/** Draws the NO2 tube pins while visible, and tracks which tube was clicked. */
export function useNo2TubeMarkers({ map, dataset, limits, visible }: UseNo2TubeMarkersProps) {
  const [selectedTubeId, setSelectedTubeId] = useState<string | null>(null)
  const data = useMemo(() => (dataset ? no2TubesGeoJson(dataset, limits) : null), [dataset, limits])

  useMapLayer(map, {
    sourceId: NO2_TUBE_SOURCE_ID,
    data: visible ? data : null,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: NO2_TUBE_LAYERS,
    events: {
      [NO2_TUBE_LAYER_ID]: {
        click: (event) => {
          const tube = featureProperties(event, TubeFeatureProperties)
          if (tube) setSelectedTubeId(tube.id)
        },
        mouseenter: () => {
          if (map) map.getCanvas().style.cursor = "pointer"
        },
        mouseleave: () => {
          if (map) map.getCanvas().style.cursor = ""
        },
      },
    },
  })

  return { selectedTubeId: visible ? selectedTubeId : null, setSelectedTubeId }
}
