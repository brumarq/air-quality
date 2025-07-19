import type mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/lib/types/air-quality"

// Generate GeoJSON for air quality data
export const generateAirQualityGeoJSON = (stations: AirQualityStation[]) => {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: {
        id: station.id,
        name: station.name,
      },
      geometry: {
        type: "Point",
        coordinates: [station.lng, station.lat],
      },
    })),
  }
}

// Add Luxembourg boundary to the map
export const addLuxembourgBoundary = (map: mapboxgl.Map) => {
  if (!map.getSource("luxembourg-boundary")) {
    map.addSource("luxembourg-boundary", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [5.74, 49.44], // SW
              [6.53, 49.44], // SE
              [6.53, 50.18], // NE
              [5.74, 50.18], // NW
              [5.74, 49.44], // Close the polygon
            ],
          ],
        },
      },
    })
  }

  if (!map.getLayer("luxembourg-outline")) {
    map.addLayer({
      id: "luxembourg-outline",
      type: "line",
      source: "luxembourg-boundary",
      layout: {},
      paint: {
        "line-color": "#d1d5db",
        "line-width": 2,
        "line-opacity": 0.7,
      },
    })
  }
}

// Add air quality data layers to the map
export const addAirQualityLayers = (
  map: mapboxgl.Map,
  stations: AirQualityStation[],
  heatmapVisible: boolean,
  glowCircleLayerId: string,
  pulseMarkerLayerId: string,
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

  // Add heatmap layer if it doesn't exist
  if (!map.getLayer("heatmap-layer")) {
    map.addLayer({
      id: "heatmap-layer",
      type: "heatmap",
      source: "air-quality-data",
      maxzoom: 15,
      paint: {
        // Weight by station presence
        "heatmap-weight": 1,
        // Increase intensity at higher zoom levels
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.1, 12, 2],
        // Color based on density
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(33, 102, 172, 0)",
          0.2,
          "rgb(103, 169, 207)",
          0.4,
          "rgb(209, 229, 240)",
          0.6,
          "rgb(253, 219, 199)",
          0.8,
          "rgb(239, 138, 98)",
          1,
          "rgb(178, 24, 43)",
        ],
        // Adjust radius by zoom level
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 9, 25, 15, 50],
        // Opacity based on visibility setting
        "heatmap-opacity": heatmapVisible ? 0.8 : 0,
      },
    })
  } else {
    // Update heatmap opacity
    map.setPaintProperty("heatmap-layer", "heatmap-opacity", heatmapVisible ? 0.8 : 0)
  }

  // Skip glow effect for now

  // Add inner circle layer if it doesn't exist
  if (!map.getLayer("air-quality-stations")) {
    map.addLayer({
      id: "air-quality-stations",
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

  // Add AQI text labels if they don't exist
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

  // Skip pulsing markers for now
}

// Animate glow effect
export const animateGlow = (map: mapboxgl.Map, glowCircleLayerId: string, callback: () => void) => {
  const t = (Date.now() % 3000) / 3000 // 3-second cycle
  const blur = 0.1 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.2
  const opacity = 0.7 + Math.sin(t * Math.PI * 2) * 0.3

  try {
    if (map && map.getLayer && map.getLayer(glowCircleLayerId)) {
      map.setPaintProperty(glowCircleLayerId, "circle-blur", blur)
      map.setPaintProperty(glowCircleLayerId, "circle-opacity", opacity)
    }
  } catch (error) {
    console.warn('Error animating glow:', error)
  }

  setTimeout(callback, 30)
}

