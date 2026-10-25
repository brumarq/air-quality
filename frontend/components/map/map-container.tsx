"use client"

import { useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapResize } from "@/hooks/use-map-resize"
import { FloatingInfoBox } from "./floating-info-box"
import { CommuneHeaderCard } from "@/components/communes/commune-header-card"
import { CommuneReadingsPanel } from "@/components/communes/commune-readings-panel"
import { PollutantTrendChart } from "@/components/communes/pollutant-trend-chart"
import { AirQualityStation } from "@/lib/types/air-quality"
import { POLLUTANT_LIMITS } from "@/lib/constants/air-quality-limits"
import { TIME_RANGES } from "@/lib/constants/time-ranges"
import { useSensorHistory } from "@/hooks/use-sensor-history"
import type { CommuneConfig } from "@/data/communes"

// Stable reference so the "no commune in view" case doesn't create a new array every
// render - a fresh [] literal there would make useSensorHistory's effect dependency look
// changed each time, loop forever calling setHistory, and crash with "Maximum update depth exceeded".
const NO_STATIONS: AirQualityStation[] = []

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

  const [selectedParameter, setSelectedParameter] = useState(POLLUTANT_LIMITS[0].parameter)
  const selectedLimit = POLLUTANT_LIMITS.find((limit) => limit.parameter === selectedParameter)!

  const [selectedRangeKey, setSelectedRangeKey] = useState(TIME_RANGES[0].key)
  const selectedRange = TIME_RANGES.find((range) => range.key === selectedRangeKey)!

  // Only fetch when a commune is in view; the main Luxembourg page has no use for this.
  const history = useSensorHistory(communeConfig ? stations : NO_STATIONS, selectedLimit, selectedRange.days)

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
        <>
          <div className="absolute top-5 left-5 z-10 flex flex-col gap-4">
            <CommuneHeaderCard
              communeConfig={communeConfig}
              selectedRangeKey={selectedRangeKey}
              onSelectRange={setSelectedRangeKey}
            />
            <CommuneReadingsPanel
              history={history}
              selectedLimit={selectedLimit}
              live={selectedRange.live}
              onSelectParameter={setSelectedParameter}
            />
          </div>

          <div className="absolute bottom-5 right-5 z-10">
            <PollutantTrendChart history={history} limit={selectedLimit} range={selectedRange} />
          </div>
        </>
      )}
    </div>
  )
}

