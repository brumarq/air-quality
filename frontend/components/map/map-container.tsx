"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useMapResize } from "@/hooks/use-map-resize"
import { FloatingInfoBox } from "./floating-info-box"
import { AirQualityStation } from "@/lib/types/air-quality"

interface MapContainerProps {
  sidebarCollapsed: boolean
  mapContainer: React.RefObject<HTMLDivElement | null>
  map: mapboxgl.Map | null
  mapLoaded: boolean
  selectedStation: AirQualityStation | null
  setSelectedStation: (station: AirQualityStation | null) => void
}

export function MapContainer({
  sidebarCollapsed,
  mapContainer,
  map,
  mapLoaded,
  selectedStation,
  setSelectedStation
}: MapContainerProps) {
  // Use the resize hook to handle map resize when sidebar state changes
  useMapResize(map, sidebarCollapsed)

  return (
    <div className="relative flex-1 h-full">
      {/* Map container */}
      <div
        ref={mapContainer}
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        </div>
      )}

      {/* Floating info box for selected station */}
      {selectedStation && (
        <FloatingInfoBox station={selectedStation} onClose={() => setSelectedStation(null)} />
      )}
    </div>
  )
}

