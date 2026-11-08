import type mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/domain/air-quality"

export const STATION_LAYER_ID = "air-quality-stations"

// Generate GeoJSON for air quality data
export const generateAirQualityGeoJSON = (stations: AirQualityStation[]) => {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((station) => ({
      type: "Feature" as const,
      properties: {
        id: station.id,
        name: station.name,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [station.lng, station.lat] as [number, number],
      },
    })),
  }
}

// Add air quality stations to the map
export const addAirQualityLayers = (
  map: mapboxgl.Map,
  stations: AirQualityStation[]
) => {
  // Add air quality data source if it doesn't exist
  if (!map.getSource("air-quality-data")) {
    map.addSource("air-quality-data", {
      type: "geojson",
      data: generateAirQualityGeoJSON(stations),
    })
  } else {
    // Update the source data
    const source = map.getSource("air-quality-data") as mapboxgl.GeoJSONSource
    source.setData(generateAirQualityGeoJSON(stations))
  }

  // Add station markers
  if (!map.getLayer("air-quality-stations")) {
    map.addLayer({
      id: STATION_LAYER_ID,
      type: "circle",
      source: "air-quality-data",
      paint: {
        "circle-radius": 10,
        "circle-color": "#ffffff",
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#14B8A6",
      },
    })
  }

  // Add station labels
  if (!map.getLayer("air-quality-labels")) {
    map.addLayer({
      id: "air-quality-labels",
      type: "symbol",
      source: "air-quality-data",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#333333",
      },
    })
  }
}
