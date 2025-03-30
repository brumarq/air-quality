import type mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/data/air-quality-stations"
import { getAQIColor } from "./aqi-utils"

// Generate GeoJSON for air quality data
export const generateAirQualityGeoJSON = (stations: AirQualityStation[]) => {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: {
        id: station.id,
        name: station.name,
        aqi: station.aqi,
        trend: station.trend,
      },
      geometry: {
        type: "Point",
        coordinates: [station.lng, station.lat],
      },
    })),
  }
}

// Create a pulsing dot animation
export const createPulsingDot = (map: mapboxgl.Map) => {
  if (map.hasImage("pulsing-dot")) return

  const size = 200
  const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd: function () {
      const canvas = document.createElement("canvas")
      canvas.width = this.width
      canvas.height = this.height
      this.context = canvas.getContext("2d")
    },

    render: function () {
      const duration = 1500
      const t = (performance.now() % duration) / duration

      const radius = (size / 2) * 0.3
      const outerRadius = (size / 2) * 0.7 * t + radius
      const context = this.context

      // Draw the outer circle
      context.clearRect(0, 0, this.width, this.height)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
      context.fillStyle = `rgba(255, 200, 200, ${1 - t})`
      context.fill()

      // Draw the inner circle
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
      context.fillStyle = "rgba(255, 100, 100, 1)"
      context.strokeStyle = "white"
      context.lineWidth = 2 + 4 * (1 - t)
      context.fill()
      context.stroke()

      // Update this image's data with data from the canvas
      this.data = context.getImageData(0, 0, this.width, this.height).data

      // Continuously repaint the map, resulting in the smooth animation of the dot
      map.triggerRepaint()

      // Return `true` to let the map know that the image was updated
      return true
    },
  }

  map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 })
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
        // Weight by AQI value
        "heatmap-weight": ["interpolate", ["linear"], ["get", "aqi"], 50, 0.4, 100, 0.6, 200, 0.8, 300, 1],
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

  // Add glowing circle effect layer if it doesn't exist
  if (!map.getLayer(glowCircleLayerId)) {
    map.addLayer({
      id: glowCircleLayerId,
      type: "circle",
      source: "air-quality-data",
      paint: {
        // Base circle color and size on AQI
        "circle-color": [
          "match",
          ["get", "aqi"],
          0,
          "#14B8A6",
          ...stations.flatMap((station) => [station.aqi, getAQIColor(station.aqi)]),
          "#14B8A6", // default color
        ],
        "circle-radius": 14,
        "circle-opacity": 0.8,
        // Add a glowing effect with a stroke and blur
        "circle-stroke-width": 2,
        "circle-stroke-color": [
          "match",
          ["get", "aqi"],
          0,
          "rgba(20, 184, 166, 0.8)",
          ...stations.flatMap((station) => [
            station.aqi,
            getAQIColor(station.aqi).replace(")", ", 0.8)").replace("rgb", "rgba"),
          ]),
          "rgba(20, 184, 166, 0.8)", // default color
        ],
        "circle-blur": 0.15,
      },
    })
  }

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
        "circle-stroke-color": [
          "match",
          ["get", "aqi"],
          0,
          "#14B8A6",
          ...stations.flatMap((station) => [station.aqi, getAQIColor(station.aqi)]),
          "#14B8A6", // default color
        ],
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
        "text-field": ["to-string", ["get", "aqi"]],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#333333",
      },
    })
  }

  // Add pulsing markers
  createPulsingDot(map)

  // Add pulsing dots layer if it doesn't exist
  if (!map.getLayer(pulseMarkerLayerId)) {
    map.addLayer({
      id: pulseMarkerLayerId,
      type: "symbol",
      source: "air-quality-data",
      layout: {
        "icon-image": "pulsing-dot",
        "icon-size": ["interpolate", ["linear"], ["get", "aqi"], 50, 0.2, 100, 0.25, 200, 0.3, 300, 0.35],
      },
    })
  }
}

// Animate glow effect
export const animateGlow = (map: mapboxgl.Map, glowCircleLayerId: string, callback: () => void) => {
  const t = (Date.now() % 3000) / 3000 // 3-second cycle
  const blur = 0.1 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.2
  const opacity = 0.7 + Math.sin(t * Math.PI * 2) * 0.3

  if (map && map.getLayer(glowCircleLayerId)) {
    map.setPaintProperty(glowCircleLayerId, "circle-blur", blur)
    map.setPaintProperty(glowCircleLayerId, "circle-opacity", opacity)
  }

  setTimeout(callback, 30)
}

