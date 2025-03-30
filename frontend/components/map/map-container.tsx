"use client"

import { useEffect, useRef, useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMap } from "@/hooks/use-map"
import { airQualityStations } from "@/data/air-quality-stations"
import { FloatingInfoBox } from "./floating-info-box"

interface MapContainerProps {
  sidebarCollapsed: boolean
}

export function MapContainer({ sidebarCollapsed }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerReady, setContainerReady] = useState(false)

  // Set container ready after mount
  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true)
    }
  }, [])

  const { mapContainer, selectedStation, setSelectedStation, mapLoaded } = useMap({
    stations: airQualityStations,
  })

  // Connect the container ref to the map
  useEffect(() => {
    if (containerRef.current) {
      mapContainer.current = containerRef.current
    }
  }, [mapContainer])

  return (
    <div className="relative flex-1 h-full">
      {/* Map container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          minHeight: "100%",
          minWidth: "100%",
          visibility: "visible", // Ensure visibility
        }}
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Floating info box for selected station */}
      {selectedStation && sidebarCollapsed && (
        <FloatingInfoBox station={selectedStation} onClose={() => setSelectedStation(null)} />
      )}
    </div>
  )
}

