"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/lib/types/air-quality"
import { addLuxembourgBoundary, addAirQualityLayers } from "@/lib/utils/map-utils"

interface UseMapLayersProps {
  map: mapboxgl.Map | null
  mapLoaded: boolean
  stations: AirQualityStation[]
}

/**
 * Hook for managing map layers and data sources
 * Handles boundary layers and station markers
 */
export function useMapLayers({ map, mapLoaded, stations }: UseMapLayersProps) {
  // Track layer initialization
  const layersInitialized = useRef(false)

  // Initialize base layers when map is ready
  useEffect(() => {
    if (!map || !mapLoaded || layersInitialized.current) return

    try {
      // Add Luxembourg country boundary layer
      addLuxembourgBoundary(map)

      // Add air quality station markers
      addAirQualityLayers(map, stations)

      layersInitialized.current = true
    } catch (error) {
      console.error("Error setting up map layers:", error)
    }
  }, [map, mapLoaded, stations])

  // Update station data when stations array changes
  useEffect(() => {
    if (!map || !mapLoaded || stations.length === 0 || !layersInitialized.current) return

    try {
      // Get the stations data source
      const source = map.getSource('air-quality-data')
      if (source && 'setData' in source) {
        // Convert stations to GeoJSON format
        const geojson = {
          type: 'FeatureCollection' as const,
          features: stations.map(station => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [station.lng, station.lat]
            },
            properties: {
              id: station.id,
              name: station.name
            }
          }))
        }
        
        // Update the map data source
        source.setData(geojson)
      }
    } catch (error) {
      console.error("Error updating stations data:", error)
    }
  }, [map, mapLoaded, stations])

  return {
    layersInitialized: layersInitialized.current
  }
}