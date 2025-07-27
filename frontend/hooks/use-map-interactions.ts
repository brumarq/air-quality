"use client"

import { useState, useEffect } from "react"
import mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/lib/types/air-quality"

interface UseMapInteractionsProps {
  map: mapboxgl.Map | null
  mapLoaded: boolean
  stations: AirQualityStation[]
}

/**
 * Hook for handling map user interactions
 * Manages station selection, hover effects, and click handlers
 */
export function useMapInteractions({ map, mapLoaded, stations }: UseMapInteractionsProps) {
  // Currently selected station state
  const [selectedStation, setSelectedStation] = useState<AirQualityStation | null>(null)

  useEffect(() => {
    if (!map || !mapLoaded || stations.length === 0) return

    // Remove existing event handlers to prevent duplicates
    map.off("click", "air-quality-stations")
    map.off("mouseenter", "air-quality-stations")
    map.off("mouseleave", "air-quality-stations")

    // Handle station clicks
    const handleStationClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features || !e.features[0]) return

      const coordinates = e.features[0].geometry.coordinates.slice()
      const properties = e.features[0].properties

      if (!properties) return

      // Find the clicked station in our data
      const station = stations.find((s) => s.id === properties.id)
      if (station) {
        setSelectedStation(station)

        // Animate to the clicked station
        map.flyTo({
          center: coordinates as [number, number],
          zoom: Math.max(map.getZoom(), 11.5), // Zoom in if not already close
          duration: 1000,
          essential: true,
        })
      }
    }

    // Handle mouse enter (hover start)
    const handleMouseEnter = () => {
      // Change cursor to pointer to indicate clickability
      map.getCanvas().style.cursor = "pointer"

      // Add subtle hover effect by increasing marker size
      map.setPaintProperty("air-quality-stations", "circle-radius", 12)
    }

    // Handle mouse leave (hover end)
    const handleMouseLeave = () => {
      // Reset cursor
      map.getCanvas().style.cursor = ""

      // Reset marker size
      map.setPaintProperty("air-quality-stations", "circle-radius", 10)
    }

    // Attach event listeners
    map.on("click", "air-quality-stations", handleStationClick)
    map.on("mouseenter", "air-quality-stations", handleMouseEnter)
    map.on("mouseleave", "air-quality-stations", handleMouseLeave)

    // Cleanup function
    return () => {
      map.off("click", "air-quality-stations", handleStationClick)
      map.off("mouseenter", "air-quality-stations", handleMouseEnter)
      map.off("mouseleave", "air-quality-stations", handleMouseLeave)
    }
  }, [map, mapLoaded, stations])

  return {
    selectedStation, // Currently selected station
    setSelectedStation, // Function to manually set selected station
  }
}