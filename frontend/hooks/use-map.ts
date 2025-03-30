"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/data/air-quality-stations"
import { addLuxembourgBoundary, addAirQualityLayers, animateGlow } from "@/lib/utils/map-utils"

// Set Mapbox access token from environment variable
// Make sure this token is valid and has the right permissions
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Add error handling for invalid token
if (!mapboxgl.accessToken) {
  console.error("Mapbox token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.")
}

interface UseMapProps {
  initialLng?: number
  initialLat?: number
  initialZoom?: number
  stations: AirQualityStation[]
}

export function useMap({ initialLng = 6.13, initialLat = 49.61, initialZoom = 9, stations }: UseMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng, setLng] = useState(initialLng)
  const [lat, setLat] = useState(initialLat)
  const [zoom, setZoom] = useState(initialZoom)
  const [heatmapVisible, setHeatmapVisible] = useState(false)
  const [selectedStation, setSelectedStation] = useState<AirQualityStation | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const pulseMarkerLayerId = useRef("pulse-markers")
  const glowCircleLayerId = useRef("glow-circles")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Toggle heatmap visibility
  const toggleHeatmap = useCallback(() => {
    setHeatmapVisible((prev) => !prev)
  }, [])

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current || !mapboxgl.accessToken) return

    // Check if token is valid
    if (!mapboxgl.accessToken) {
      setMapError("Mapbox token is missing")
      return
    }

    try {
      const mapStyle = "mapbox://styles/mapbox/light-v11"

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false, // We'll add this manually
      })

      // Handle map loading errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

      // Add controls after map is initialized
      map.current.on('style.load', () => {
        if (!map.current) return;
        
        // Add controls
        map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left")
        
        map.current.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "bottom-right",
        )
        
        map.current.addControl(new mapboxgl.FullscreenControl(), "top-right")
      });

      // Update coordinates on map move
      map.current.on("move", () => {
        if (!map.current) return
        setLng(Number.parseFloat(map.current.getCenter().lng.toFixed(4)))
        setLat(Number.parseFloat(map.current.getCenter().lat.toFixed(4)))
        setZoom(Number.parseFloat(map.current.getZoom().toFixed(2)))
      })

      // Set up the map when it's fully loaded
      map.current.on("load", () => {
        if (!map.current) return

        try {
          // Add Luxembourg boundary
          addLuxembourgBoundary(map.current)

          // Add air quality data layers
          addAirQualityLayers(map.current, stations, heatmapVisible, glowCircleLayerId.current, pulseMarkerLayerId.current)

          // Add event handlers for interactivity
          map.current.on("click", "air-quality-stations", (e) => {
            if (!map.current || !e.features || !e.features[0]) return

            const coordinates = e.features[0].geometry.coordinates.slice()
            const properties = e.features[0].properties

            if (!properties) return

            // Find the selected station
            const station = stations.find((s) => s.id === properties.id)
            if (station) {
              setSelectedStation(station)

              // Zoom to the clicked point with animation
              map.current.flyTo({
                center: coordinates as [number, number],
                zoom: Math.max(map.current.getZoom(), 11.5),
                duration: 1000,
                essential: true,
              })
            }
          })

          // Change cursor on hover
          map.current.on("mouseenter", "air-quality-stations", () => {
            if (!map.current) return
            map.current.getCanvas().style.cursor = "pointer"

            // Add subtle zoom effect on hover
            map.current.setPaintProperty("air-quality-stations", "circle-radius", 12)
            map.current.setPaintProperty(glowCircleLayerId.current, "circle-radius", 16)
          })

          map.current.on("mouseleave", "air-quality-stations", () => {
            if (!map.current) return
            map.current.getCanvas().style.cursor = ""

            // Reset circle size
            map.current.setPaintProperty("air-quality-stations", "circle-radius", 10)
            map.current.setPaintProperty(glowCircleLayerId.current, "circle-radius", 14)
          })

          // Set up animation for glow effect
          function animateGlowEffect() {
            if (!map.current) return
            animateGlow(map.current, glowCircleLayerId.current, animateGlowEffect)
          }

          animateGlowEffect()
          setMapLoaded(true)
          setMapError(null)

          // Force a resize to ensure the map renders correctly
          setTimeout(() => {
            if (map.current) map.current.resize()
          }, 100)
        } catch (error) {
          console.error("Error setting up map layers:", error)
          setMapError(`Error setting up map layers: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      })

      // Force resize on window resize
      const handleResize = () => {
        if (map.current) map.current.resize()
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (map.current) map.current.remove()
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError(`Error initializing map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [initialLng, initialLat, initialZoom, stations])

  // Update heatmap visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      if (map.current.getLayer("heatmap-layer")) {
        map.current.setPaintProperty("heatmap-layer", "heatmap-opacity", heatmapVisible ? 0.8 : 0)
        map.current.resize() // Ensure map updates properly
      }
    } catch (error) {
      console.error("Error updating heatmap visibility:", error)
    }
  }, [heatmapVisible, mapLoaded])

  return {
    mapContainer,
    lng,
    lat,
    zoom,
    heatmapVisible,
    selectedStation,
    mapLoaded,
    mapError,
    toggleHeatmap,
    setSelectedStation,
  }
}