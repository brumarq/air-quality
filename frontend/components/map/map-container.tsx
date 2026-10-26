"use client"

import { useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapResize } from "@/hooks/use-map-resize"
import { CustomMapControls } from "./custom-map-controls"
import { CommuneHeaderCard, type AreaMode } from "@/components/communes/commune-header-card"
import { CommuneReadingsPanel } from "@/components/communes/commune-readings-panel"
import { HeatPlaceholderCard } from "@/components/communes/heat-placeholder-card"
import { PollutantTrendChart } from "@/components/communes/pollutant-trend-chart"
import { NO2ReductionCard } from "@/components/communes/no2-reduction-card"
import { NO2TubeDetailCard } from "@/components/communes/no2-tube-detail-card"
import { ReportCard } from "@/components/communes/report-card"
import { AirQualityStation } from "@/lib/types/air-quality"
import { POLLUTANT_LIMITS } from "@/lib/constants/air-quality-limits"
import { TIME_RANGES } from "@/lib/constants/time-ranges"
import { useSensorHistory } from "@/hooks/use-sensor-history"
import { useNo2TubeMarkers } from "@/hooks/use-no2-tube-markers"
import { getNo2TubeDataset } from "@/lib/no2-tubes"
import type { CommuneConfig } from "@/data/communes"

interface MapContainerProps {
  sidebarCollapsed: boolean
  mapContainer: React.RefObject<HTMLDivElement | null>
  map: mapboxgl.Map | null
  mapLoaded: boolean
  stations: AirQualityStation[]
  communeConfig: CommuneConfig
}

// One island layout for every area (Luxembourg-wide or a single commune) - see
// MapLayout for why communeConfig is never optional here.
export function MapContainer({
  sidebarCollapsed,
  mapContainer,
  map,
  mapLoaded,
  stations,
  communeConfig
}: MapContainerProps) {
  // Use the resize hook to handle map resize when sidebar state changes
  useMapResize(map, sidebarCollapsed)

  const [mode, setMode] = useState<AreaMode>("air")

  const [selectedParameter, setSelectedParameter] = useState(POLLUTANT_LIMITS[0].parameter)
  const selectedLimit = POLLUTANT_LIMITS.find((limit) => limit.parameter === selectedParameter)!

  const [selectedRangeKey, setSelectedRangeKey] = useState(TIME_RANGES[0].key)
  const selectedRange = TIME_RANGES.find((range) => range.key === selectedRangeKey)!

  // Heat mode has no data fetching need yet.
  const history = useSensorHistory(mode === "air" ? stations : [], selectedLimit, selectedRange.days)

  // NO2 tubes: only exist for communes with a Pacte Climat dataset (Esch today), only
  // shown in air mode. See ESCH-HEAT-PROFILE-PLAN.md Step 2.5.
  const tubeDataset = getNo2TubeDataset(communeConfig.slug)
  const { selectedTubeId, setSelectedTubeId } = useNo2TubeMarkers({
    map,
    mapLoaded,
    dataset: tubeDataset,
    visible: mode === "air",
  })

  return (
    <div className="relative flex-1 h-full">
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minWidth: "100%", visibility: "visible" }}
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

      {/* Floating "islands": the outer grid is pointer-events-none so the map stays
          draggable between cards; each card opts back in with pointer-events-auto. */}
      <div className="absolute inset-4 flex gap-4 pointer-events-none">
        <div className="flex-none w-96 flex flex-col gap-4 pointer-events-none">
          <CommuneHeaderCard
            communeConfig={communeConfig}
            mode={mode}
            onSelectMode={setMode}
            selectedRangeKey={selectedRangeKey}
            onSelectRange={setSelectedRangeKey}
          />
          {mode === "air" ? (
            <>
              <CommuneReadingsPanel
                history={history}
                selectedLimit={selectedLimit}
                range={selectedRange}
                onSelectParameter={setSelectedParameter}
              />
              {tubeDataset &&
                (selectedTubeId ? (
                  <NO2TubeDetailCard dataset={tubeDataset} tubeId={selectedTubeId} onBack={() => setSelectedTubeId(null)} />
                ) : (
                  <NO2ReductionCard
                    dataset={tubeDataset}
                    selectedTubeId={selectedTubeId}
                    onSelectTube={setSelectedTubeId}
                  />
                ))}
            </>
          ) : (
            <HeatPlaceholderCard />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between items-end gap-4 pointer-events-none">
          <div className="flex flex-col items-end gap-4 pointer-events-none">
            <ReportCard />
            <CustomMapControls map={map} communeConfig={communeConfig} />
          </div>

          {mode === "air" && (
            <div className="self-stretch pointer-events-none">
              <PollutantTrendChart history={history} limit={selectedLimit} range={selectedRange} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
