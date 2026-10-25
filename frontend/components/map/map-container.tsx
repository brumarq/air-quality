"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useMapResize } from "@/hooks/use-map-resize"
import { FloatingInfoBox } from "./floating-info-box"
import { CommuneHeaderCard } from "@/components/communes/commune-header-card"
import { CommuneReadingsPanel } from "@/components/communes/commune-readings-panel"
import { AirQualityStation } from "@/lib/types/air-quality"
import type { CommuneConfig } from "@/data/communes"

interface MapContainerProps {
  sidebarCollapsed: boolean
  mapContainer: React.RefObject<HTMLDivElement | null>
  map: mapboxgl.Map | null
  mapLoaded: boolean
  selectedStation: AirQualityStation | null
  setSelectedStation: (station: AirQualityStation | null) => void
  stations: AirQualityStation[]
  communeConfig?: CommuneConfig
}

export function MapContainer({
  sidebarCollapsed,
  mapContainer,
  map,
  mapLoaded,
  selectedStation,
  setSelectedStation,
  stations,
  communeConfig
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

      {/* Commune header + readings panel, always visible on a commune page */}
      {communeConfig && (
        <div className="absolute top-5 left-5 z-10 flex flex-col gap-4">
          <CommuneHeaderCard communeConfig={communeConfig} />
          <CommuneReadingsPanel stations={stations} />
        </div>
      )}
    </div>
  )
}

