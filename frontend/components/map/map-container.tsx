"use client"

import { useEffect, useRef, useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMap } from "@/hooks/use-map"
import { useMapResize } from "@/hooks/use-map-resize"
import { getAirQualityStations } from "@/data/air-quality-stations"
import { FloatingInfoBox } from "./floating-info-box"
import { AirQualityStation } from "@/lib/types/air-quality"

interface MapContainerProps {
  sidebarCollapsed: boolean
}

export function MapContainer({ sidebarCollapsed }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  // Fetch stations data
  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data)
        setStationsLoaded(true)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
        setStationsLoaded(true) // Still set loaded to true to prevent infinite loading
      }
    }

    fetchStations()
  }, [])


  const { mapContainer, map, selectedStation, setSelectedStation, mapLoaded } = useMap({
    stations: stationsLoaded ? stations : [],
  })

  // Use the resize hook to handle map resize when sidebar state changes
  useMapResize(map, sidebarCollapsed)

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
      {(!mapLoaded || !stationsLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">
              {!stationsLoaded ? 'Loading stations...' : 'Loading map...'}
            </div>
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

