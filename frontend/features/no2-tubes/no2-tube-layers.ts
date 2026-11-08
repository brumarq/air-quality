import type { LayerSpecification } from "mapbox-gl"
import { z } from "zod"
import type { No2Limits } from "@/domain/limits"
import { classifyNo2, getLatestReading, type No2TubeDataset } from "@/domain/no2-tubes"
import { tokens } from "@/theme/tokens"
import { NO2_BAND_COLOR } from "./no2-band-colors"

// Its own source and layer, apart from the station markers, so tube pins can be shown
// and hidden on their own.
export const NO2_TUBE_SOURCE_ID = "no2-tube-data"
export const NO2_TUBE_LAYER_ID = "no2-tube-markers"

export const TubeFeatureProperties = z.object({ id: z.string() })

export function no2TubesGeoJson(dataset: No2TubeDataset, limits: No2Limits): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: dataset.tubes.map((tube) => {
      const latest = getLatestReading(tube)
      return {
        type: "Feature",
        properties: {
          id: tube.id,
          name: tube.name,
          color: latest ? NO2_BAND_COLOR[classifyNo2(latest.value, limits)] : tokens.no2.markerNoData,
        },
        geometry: { type: "Point", coordinates: [tube.lng, tube.lat] },
      }
    }),
  }
}

export const NO2_TUBE_LAYERS: LayerSpecification[] = [
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
