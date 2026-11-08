"use client"

import { useEffect, useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapResize } from "@/hooks/use-map-resize"
import { CustomMapControls } from "./custom-map-controls"
import { CommuneHeaderCard, type AreaMode } from "@/components/communes/commune-header-card"
import { CommuneReadingsPanel } from "@/components/communes/commune-readings-panel"
import { PollutantTrendChart } from "@/components/communes/pollutant-trend-chart"
import { NO2ReductionCard } from "@/components/communes/no2-reduction-card"
import { NO2TubeDetailCard } from "@/components/communes/no2-tube-detail-card"
import { HeatMapCard } from "@/components/communes/heat-map-card"
import { HeatDetailCard, type HeatSelection } from "@/components/communes/heat-detail-card"
import { HeatStoryPanel } from "@/components/communes/heat-story-panel"
import { ReportCard } from "@/components/communes/report-card"
import { AirQualityStation } from "@/domain/air-quality"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import { TIME_RANGES } from "@/domain/time-ranges"
import { useSensorHistory } from "@/hooks/use-sensor-history"
import { useNo2TubeMarkers } from "@/hooks/use-no2-tube-markers"
import { useHeatMapLayers, type HeatLayerToggles } from "@/hooks/use-heat-map-layers"
import { getNo2TubeDataset } from "@/api/no2-tubes"
import { getHeatYears } from "@/domain/heat"
import type { CommuneConfig } from "@/domain/communes"

interface MapContainerProps {
  sidebarCollapsed: boolean
  mapContainer: React.RefCallback<HTMLDivElement>
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

  // Heat mode: see ESCH-HEAT-PROFILE-PLAN.md Step 3, Week 2. Grid + buildings shown by
  // default; NDVI and the PRO-SUD study overlay are off by default to avoid clutter.
  const [heatYear, setHeatYear] = useState(2025)
  const [heatToggles, setHeatToggles] = useState<HeatLayerToggles>({
    grid: true,
    ndvi: false,
    buildings: true,
    prosudWms: false,
  })
  const [heatSelection, setHeatSelection] = useState<HeatSelection | null>(null)

  const {
    data: heatData,
    selectedCellId,
    setSelectedCellId,
    selectedBuildingId,
    setSelectedBuildingId,
  } = useHeatMapLayers({
    map,
    mapLoaded,
    communeSlug: communeConfig.slug,
    visible: mode === "heat",
    year: heatYear,
    toggles: heatToggles,
  })

  useEffect(() => {
    if (selectedCellId) setHeatSelection({ type: "cell", id: selectedCellId })
    else if (selectedBuildingId) setHeatSelection({ type: "building", id: selectedBuildingId })
    else setHeatSelection(null)
  }, [selectedCellId, selectedBuildingId])

  useEffect(() => {
    if (heatData) {
      const years = getHeatYears(heatData.stats)
      if (years.length && !years.includes(heatYear)) setHeatYear(years[years.length - 1])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatData])

  function clearHeatSelection() {
    setSelectedCellId(null)
    setSelectedBuildingId(null)
  }

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
            <>
              {heatSelection ? (
                heatData && <HeatDetailCard data={heatData} selection={heatSelection} year={heatYear} onBack={clearHeatSelection} />
              ) : (
                <HeatMapCard
                  stats={heatData?.stats ?? null}
                  year={heatYear}
                  onSelectYear={setHeatYear}
                  toggles={heatToggles}
                  onToggle={(key, value) => setHeatToggles((prev) => ({ ...prev, [key]: value }))}
                />
              )}
            </>
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

          {mode === "heat" && heatData && (
            <div className="self-stretch flex justify-end pointer-events-none">
              <HeatStoryPanel data={heatData} communeName={communeConfig.name} tubeDataset={tubeDataset} map={map} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
