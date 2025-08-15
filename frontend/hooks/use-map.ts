"use client"

import type { AirQualityStation } from "@/lib/types/air-quality"
import { useMapboxInstance } from "./use-mapbox-instance"
import { useMapCoordinates } from "./use-map-coordinates"
import { useMapLayers } from "./use-map-layers"
import { useMapInteractions } from "./use-map-interactions"

interface UseMapProps {
  initialLng?: number
  initialLat?: number
  initialZoom?: number
  stations: AirQualityStation[]
}

/**
 * Main map hook that orchestrates all map functionality
 */
export function useMap({ 
  initialLng = 6.13, 
  initialLat = 49.61, 
  initialZoom = 9, 
  stations 
}: UseMapProps) {
  
  // Initialize Mapbox instance and handle basic setup
  const { mapContainer, map, mapLoaded, mapError } = useMapboxInstance({
    initialLng,
    initialLat,
    initialZoom,
  })

  // Track map position and zoom level
  const { lng, lat, zoom } = useMapCoordinates({
    map,
    initialLng,
    initialLat,
    initialZoom,
  })

  // Manage map layers and data visualization
  useMapLayers({
    map,
    mapLoaded,
    stations,
  })

  // Handle user interactions (clicks, hovers)
  const { selectedStation, setSelectedStation } = useMapInteractions({
    map,
    mapLoaded,
    stations,
  })

  return {
    mapContainer, // Ref for DOM attachment
    map, // Mapbox instance 
    lng, // Current longitude
    lat, // Current latitude
    zoom, // Current zoom level
    selectedStation, // Currently selected station
    mapLoaded, // Boolean: is map ready for use
    mapError, // Error message if initialization failed
    setSelectedStation, // Function to manually select a station
  }
}
