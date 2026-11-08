import type { LayerSpecification } from "mapbox-gl"
import { z } from "zod"
import type { AirQualityStation } from "@/domain/air-quality"
import { tokens } from "@/theme/tokens"

export const STATION_SOURCE_ID = "air-quality-data"
export const STATION_LAYER_ID = "air-quality-stations"
export const STATION_LABEL_LAYER_ID = "air-quality-labels"

export const MARKER_RADIUS = 10
export const MARKER_RADIUS_HOVER = 12

/** What each station feature carries; read back with featureProperties on click. */
export const StationFeatureProperties = z.object({ id: z.number(), name: z.string() })

export function stationsGeoJson(stations: AirQualityStation[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: { id: station.id, name: station.name } satisfies z.infer<typeof StationFeatureProperties>,
      geometry: { type: "Point", coordinates: [station.lng, station.lat] },
    })),
  }
}

export const STATION_LAYERS: LayerSpecification[] = [
  {
    id: STATION_LAYER_ID,
    type: "circle",
    source: STATION_SOURCE_ID,
    paint: {
      "circle-radius": MARKER_RADIUS,
      "circle-color": tokens.map.stationFill,
      "circle-opacity": 0.9,
      "circle-stroke-width": 2,
      "circle-stroke-color": tokens.map.stationStroke,
    },
  },
  {
    id: STATION_LABEL_LAYER_ID,
    type: "symbol",
    source: STATION_SOURCE_ID,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": tokens.map.stationLabel },
  },
]
