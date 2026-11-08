import type { No2Limits } from "@/domain/limits"
import { classifyNo2, getLatestReading, type No2TubeDataset } from "@/domain/no2-tubes"
import { tokens } from "@/theme/tokens"
import { NO2_BAND_COLOR } from "./no2-band-colors"

export const NO2_TUBE_SOURCE_ID = "no2-tube-data"
export const NO2_TUBE_LAYER_ID = "no2-tube-markers"

export function generateNo2TubeGeoJSON(dataset: No2TubeDataset, limits: No2Limits) {

  return {
    type: "FeatureCollection" as const,
    features: dataset.tubes.map((tube) => {
      const latest = getLatestReading(tube)
      return {
        type: "Feature" as const,
        properties: {
          id: tube.id,
          name: tube.name,
          color: latest ? NO2_BAND_COLOR[classifyNo2(latest.value, limits)] : tokens.no2.markerNoData,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [tube.lng, tube.lat] as [number, number],
        },
      }
    }),
  }
}

// Mirrors addAirQualityLayers in map-utils.ts, as its own source/layer pair so tube
// markers can be toggled independently of the live station markers.
export function addNo2TubeLayers(map: mapboxgl.Map, dataset: No2TubeDataset, limits: No2Limits) {
  const geojson = generateNo2TubeGeoJSON(dataset, limits)

  if (!map.getSource(NO2_TUBE_SOURCE_ID)) {
    map.addSource(NO2_TUBE_SOURCE_ID, { type: "geojson", data: geojson })
  } else {
    const source = map.getSource(NO2_TUBE_SOURCE_ID) as mapboxgl.GeoJSONSource
    source.setData(geojson)
  }

  if (!map.getLayer(NO2_TUBE_LAYER_ID)) {
    map.addLayer({
      id: NO2_TUBE_LAYER_ID,
      type: "circle",
      source: NO2_TUBE_SOURCE_ID,
      paint: {
        "circle-radius": 7,
        "circle-color": ["get", "color"],
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    })
  }
}

export function removeNo2TubeLayers(map: mapboxgl.Map) {
  if (map.getLayer(NO2_TUBE_LAYER_ID)) map.removeLayer(NO2_TUBE_LAYER_ID)
  if (map.getSource(NO2_TUBE_SOURCE_ID)) map.removeSource(NO2_TUBE_SOURCE_ID)
}
