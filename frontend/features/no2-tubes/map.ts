"use client"

import type { LayerSpecification, Map as MapboxMap } from "mapbox-gl"
import { z } from "zod"
import { NO2_BAND_COLOR, classifyNo2, getLatestReading, type No2TubeDataset } from "./model"
import { tokens } from "@/shared/theme/tokens"
import { useMemo, useState } from "react"
import { firstFeatureProperties } from "@/shared/map/feature-properties"
import { useMapLayer } from "@/shared/map/use-map-layer"

const NO2_TUBE_SOURCE_ID = "no2-tube-data"
const NO2_TUBE_LAYER_ID = "no2-tube-markers"

const TubeFeatureProperties = z.object({ id: z.string() })

export function no2TubesGeoJson(dataset: No2TubeDataset): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: dataset.tubes.map((tube) => {
      const latest = getLatestReading(tube)
      return {
        type: "Feature",
        properties: {
          id: tube.id,
          name: tube.name,
          color: latest ? NO2_BAND_COLOR[classifyNo2(latest.value)] : tokens.no2.markerNoData,
        },
        geometry: { type: "Point", coordinates: [tube.lng, tube.lat] },
      }
    }),
  }
}

const NO2_TUBE_LAYERS: LayerSpecification[] = [
  {
    id: NO2_TUBE_LAYER_ID,
    type: "circle",
    source: NO2_TUBE_SOURCE_ID,
    paint: {
      "circle-radius": 7,
      "circle-color": ["get", "color"],
      "circle-opacity": 0.9,
      "circle-stroke-width": 2,
      "circle-stroke-color": tokens.no2.markerStroke,
    },
  },
]

interface UseNo2TubeMarkersProps {
  map: MapboxMap | null
  dataset: No2TubeDataset | null
  visible: boolean
}

export function useNo2TubeMarkers({ map, dataset, visible }: UseNo2TubeMarkersProps) {
  const [selectedTubeId, setSelectedTubeId] = useState<string | null>(null)
  const data = useMemo(() => (dataset ? no2TubesGeoJson(dataset) : null), [dataset])

  useMapLayer(map, {
    sourceId: NO2_TUBE_SOURCE_ID,
    data: visible ? data : null,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: NO2_TUBE_LAYERS,
    events: {
      [NO2_TUBE_LAYER_ID]: {
        click: (event) => {
          const tube = firstFeatureProperties(event, TubeFeatureProperties)
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
