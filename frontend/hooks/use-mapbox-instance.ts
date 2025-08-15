"use client"

import { useRef, useState, useEffect } from "react"
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
  // Refs for DOM container and map instance
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  
  // State for tracking map lifecycle
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    // Prevent re-initialization if map already exists
    if (map.current || !mapContainer.current || !mapboxgl.accessToken) return

    // Validate Mapbox token before proceeding
    if (!mapboxgl.accessToken) {
      setMapError("Mapbox token is missing")
      return
    }

    try {
      // Initialize Mapbox instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11", // Clean, minimal style
        center: [initialLng, initialLat],
        zoom: initialZoom,
        attributionControl: false, // We'll add this manually with compact layout
      })

      // Handle any map errors (network, style loading, etc.)
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error)
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`)
      })

      // Add map controls after style loads
      map.current.on('style.load', () => {
        if (!map.current) return
        
        // Add compact attribution control
        map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left")
        
        // Add navigation controls (zoom in/out) without compass
        map.current.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "bottom-right",
        )
        
        // Add fullscreen toggle
        map.current.addControl(new mapboxgl.FullscreenControl(), "top-right")
      })

      // Mark map as ready for data layers
      map.current.on("load", () => {
        setMapLoaded(true)
        setMapError(null)
        
        // Force resize after a brief delay to ensure proper rendering
        setTimeout(() => {
          if (map.current) map.current.resize()
        }, 100)
      })

      // Handle window resize events
      const handleResize = () => {
        if (map.current) map.current.resize()
      }
      window.addEventListener("resize", handleResize)

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize)
        if (map.current) map.current.remove()
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError(`Error initializing map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [initialLng, initialLat, initialZoom, mapContainer.current])

  return {
    mapContainer, // Ref to attach to DOM element
    map: map.current, // Mapbox instance for other hooks
    mapLoaded, // Boolean indicating if map is ready for data
    mapError, // Error message if initialization failed
  }
}