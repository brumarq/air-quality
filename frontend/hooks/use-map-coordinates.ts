"use client"

import { useState, useEffect } from "react"
import mapboxgl from "mapbox-gl"

interface UseMapCoordinatesProps {
  map: mapboxgl.Map | null
  initialLng: number
  initialLat: number
  initialZoom: number
}

/**
 * Hook for tracking map position and zoom level
 * Updates state when user pans/zooms the map
 */
export function useMapCoordinates({ map, initialLng, initialLat, initialZoom }: UseMapCoordinatesProps) {
  // Current map viewport state
  const [lng, setLng] = useState(initialLng)
  const [lat, setLat] = useState(initialLat)
  const [zoom, setZoom] = useState(initialZoom)

  useEffect(() => {
    if (!map) return

    // Update coordinates whenever the map moves (pan, zoom, etc.)
    const handleMove = () => {
      const center = map.getCenter()
      const currentZoom = map.getZoom()
      
      // Round to reasonable precision to avoid excessive re-renders
      setLng(Number.parseFloat(center.lng.toFixed(4)))
      setLat(Number.parseFloat(center.lat.toFixed(4)))
      setZoom(Number.parseFloat(currentZoom.toFixed(2)))
    }

    // Listen for map movement events
    map.on("move", handleMove)

    // Cleanup listener
    return () => {
      map.off("move", handleMove)
    }
  }, [map])

  return {
    lng, // Current longitude
    lat, // Current latitude  
    zoom, // Current zoom level
  }
}