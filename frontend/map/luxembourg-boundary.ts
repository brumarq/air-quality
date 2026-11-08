import { useEffect } from "react"
import type mapboxgl from "mapbox-gl"

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

export function useLuxembourgBoundary(map: mapboxgl.Map | null, mapLoaded: boolean) {
  useEffect(() => {
    if (map && mapLoaded) addLuxembourgBoundary(map)
  }, [map, mapLoaded])
}
