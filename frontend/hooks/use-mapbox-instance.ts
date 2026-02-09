"use client"

import { useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"

// Configure Mapbox access token from environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

interface UseMapboxInstanceProps {
  initialLng: number
  initialLat: number
  initialZoom: number
}

/**
 * Hook for managing the core Mapbox GL instance
 * Handles initialization, error states, and basic controls
 */
export function useMapboxInstance({ initialLng, initialLat, initialZoom }: UseMapboxInstanceProps) {
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Callback ref — fires as soon as the div mounts in the DOM
  const mapContainer = useCallback((node: HTMLDivElement | null) => {
    if (!node || map.current || !mapboxgl.accessToken) return

    try {
      map.current = new mapboxgl.Map({
        container: node,
        style: "mapbox://styles/mapbox/light-v11",
        center: [initialLng, initialLat],
        zoom: initialZoom,
        attributionControl: false,
      })

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error)
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`)
      })

      map.current.on('style.load', () => {
        if (!map.current) return
        map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left")
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
          "bottom-right",
        )
        map.current.addControl(new mapboxgl.FullscreenControl(), "top-right")
      })

      map.current.on("load", () => {
        setMapLoaded(true)
        setMapError(null)
        setTimeout(() => {
          if (map.current) map.current.resize()
        }, 100)
      })

      const handleResize = () => {
        if (map.current) map.current.resize()
      }
      window.addEventListener("resize", handleResize)
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError(`Error initializing map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [initialLng, initialLat, initialZoom])

  return {
    mapContainer,
    map: map.current,
    mapLoaded,
    mapError,
  }
}