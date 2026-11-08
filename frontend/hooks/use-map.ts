"use client"

import type { AirQualityStation } from "@/domain/air-quality"
import { useMapboxInstance } from "./use-mapbox-instance"
import { useMapLayers } from "./use-map-layers"
import { useMapInteractions } from "./use-map-interactions"

interface UseMapProps {
  initialLng?: number
  initialLat?: number
  initialZoom?: number
  stations: AirQualityStation[]
  showNavigationControl?: boolean
}

/**
 * Main map hook that orchestrates all map functionality
 */
export function useMap({
  initialLng = 6.13,
  initialLat = 49.61,
  initialZoom = 9,
  stations,
  showNavigationControl = true,
}: UseMapProps) {

  // Initialize Mapbox instance and handle basic setup
  const { mapContainer, map, mapLoaded, mapError } = useMapboxInstance({
    initialLng,
    initialLat,
    initialZoom,
    showNavigationControl,
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
    selectedStation, // Currently selected station
    mapLoaded, // Boolean: is map ready for use
    mapError, // Error message if initialization failed
    setSelectedStation, // Function to manually select a station
  }
}
