"use client"

import { useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { CommuneReadingsPanel, PollutantTrendChart, useSensorHistory } from "@/features/air-quality"
import { HeatDetailCard, HeatMapCard, HeatMessage, HeatStoryPanel, useHeatMapLayers, type HeatLayerToggles } from "@/features/heat"
import { NO2ReductionCard, NO2TubeDetailCard, NO2TubesMessage, useNo2TubeMarkers } from "@/features/no2-tubes"
import { useMapResize } from "@/map/use-map-resize"
import { CustomMapControls } from "@/map/custom-map-controls"
import type { MapStatus } from "@/map/use-mapbox-instance"
import { CommuneHeaderCard, type AreaMode } from "./commune-header-card"
import { ReportCard } from "./report-card"
import { AirQualityStation } from "@/domain/air-quality"
import { NO2_LIMITS, POLLUTANT_LIMITS, type PollutantParameter } from "@/domain/limits"
import { TIME_RANGES, type RangeKey } from "@/domain/time-ranges"
import { fetchNo2TubeDataset } from "@/api/no2-tubes"
import { useAsync } from "@/lib/use-async"
import type { Area } from "@/domain/area"
import type { LngLat } from "@/domain/shared/geo"

interface MapContainerProps {
  sidebarCollapsed: boolean
  mapContainer: React.RefCallback<HTMLDivElement>
  map: mapboxgl.Map | null
  mapStatus: MapStatus
  stations: AirQualityStation[]
  area: Area
}

export function MapContainer({
  sidebarCollapsed,
  mapContainer,
  map,
  mapStatus,
  stations,
  area
}: MapContainerProps) {
  const commune = area.kind === "commune" ? area : null
  // Use the resize hook to handle map resize when sidebar state changes
  useMapResize(map, sidebarCollapsed)

  const [mode, setMode] = useState<AreaMode>("air")

  const [selectedParameter, setSelectedParameter] = useState<PollutantParameter>("no2")
  const selectedLimit = POLLUTANT_LIMITS[selectedParameter]

  const [selectedRangeKey, setSelectedRangeKey] = useState<RangeKey>("live")
  const selectedRange = TIME_RANGES[selectedRangeKey]

  const history = useSensorHistory(mode === "air" ? stations : null, selectedLimit, selectedRange.days)

  // NO2 tubes: only exist for communes with a Pacte Climat dataset (Esch today), only
  // shown in air mode. See ESCH-HEAT-PROFILE-PLAN.md Step 2.5.
  const tubeSlug = commune?.datasets.no2Tubes ? commune.slug : null
  const tubeLoad = useAsync(tubeSlug && `no2-tubes|${tubeSlug}`, (signal) => fetchNo2TubeDataset(tubeSlug ?? "", signal))
  const tubeDataset = tubeLoad.status === "ready" && tubeLoad.data.status === "ok" ? tubeLoad.data.data : null
  const tubeLoadFailed = tubeLoad.status === "error" || (tubeLoad.status === "ready" && tubeLoad.data.status === "error")
  const { selectedTubeId, setSelectedTubeId } = useNo2TubeMarkers({
    map,
    dataset: tubeDataset,
    limits: NO2_LIMITS,
    visible: mode === "air",
  })

  // Grid and buildings are on by default; NDVI and the study overlay are off to avoid clutter.
  const [heatToggles, setHeatToggles] = useState<HeatLayerToggles>({
    grid: true,
    ndvi: false,
    buildings: true,
    studyOverlay: false,
  })
  // The year the user picked, if any; otherwise the latest summer in the data.
  const [pickedHeatYear, setPickedHeatYear] = useState<number | null>(null)

  const {
    load: heatLoad,
    data: heatData,
    year: heatYear,
    selection: heatSelection,
    setSelection: setHeatSelection,
  } = useHeatMapLayers({
    map,
    communeSlug: commune?.datasets.heat ? commune.slug : null,
    studyOverlay: commune?.studyOverlay ?? null,
    visible: mode === "heat",
    pickedYear: pickedHeatYear,
    toggles: heatToggles,
  })

  const flyTo = (lngLat: LngLat) => map?.flyTo({ center: [lngLat[0], lngLat[1]], zoom: 16 })

  return (
    <div className="relative flex-1 h-full">
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minWidth: "100%", visibility: "visible" }}
      />

      {/* Loading indicator */}
      {mapStatus.status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        </div>
      )}
      {mapStatus.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div role="alert" className="text-sm text-muted-foreground">
            Map unavailable: {mapStatus.message}
          </div>
        </div>
      )}
      {mapStatus.status === "ready" && mapStatus.issue && (
        <div role="status" className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 rounded-md bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow">
          Some map content didn&apos;t load: {mapStatus.issue}
        </div>
      )}

      {/* Floating "islands": the outer grid is pointer-events-none so the map stays
          draggable between cards; each card opts back in with pointer-events-auto. */}
      <div className="absolute inset-4 flex gap-4 pointer-events-none">
        <div className="flex-none w-96 flex flex-col gap-4 pointer-events-none">
          <CommuneHeaderCard
            area={area}
            mode={mode}
            onSelectMode={(next) => {
              // Leaving air mode closes the tube detail, as it did when the pins were removed.
              setSelectedTubeId(null)
              setMode(next)
            }}
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
              {tubeSlug && tubeLoad.status === "loading" && (
                <NO2TubesMessage role="status">Loading NO₂ tube data...</NO2TubesMessage>
              )}
              {tubeLoadFailed && <NO2TubesMessage role="alert">Couldn&apos;t load NO₂ tube data.</NO2TubesMessage>}
              {tubeDataset &&
                (selectedTubeId ? (
                  <NO2TubeDetailCard dataset={tubeDataset} limits={NO2_LIMITS} tubeId={selectedTubeId} onBack={() => setSelectedTubeId(null)} />
                ) : (
                  <NO2ReductionCard
                    dataset={tubeDataset}
                    limits={NO2_LIMITS}
                    selectedTubeId={selectedTubeId}
                    onSelectTube={setSelectedTubeId}
                  />
                ))}
            </>
          ) : (
            <>
              {heatLoad.status === "loading" ? (
                <HeatMessage role="status">Loading heat-map data...</HeatMessage>
              ) : heatLoad.status === "error" || heatLoad.data.status === "error" ? (
                <HeatMessage role="alert">Couldn&apos;t load heat data.</HeatMessage>
              ) : heatLoad.data.status === "not-prepared" ? (
                <HeatMessage>No heat-map data prepared for this commune yet.</HeatMessage>
              ) : heatYear === null ? (
                <HeatMessage>No heat-map data prepared for this commune yet.</HeatMessage>
              ) : heatSelection ? (
                <HeatDetailCard data={heatLoad.data.data} selection={heatSelection} year={heatYear} onBack={() => setHeatSelection(null)} />
              ) : (
                <HeatMapCard
                  data={heatLoad.data.data}
                  studyOverlay={commune?.studyOverlay ?? null}
                  year={heatYear}
                  onSelectYear={setPickedHeatYear}
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
            <CustomMapControls
              onZoomIn={() => map?.zoomIn()}
              onZoomOut={() => map?.zoomOut()}
              onRecenter={() => map?.flyTo({ center: [area.center[0], area.center[1]], zoom: area.zoom })}
              recenterLabel={area.name}
            />
          </div>

          {mode === "air" && (
            <div className="self-stretch pointer-events-none">
              <PollutantTrendChart history={history} limit={selectedLimit} range={selectedRange} />
            </div>
          )}

          {mode === "heat" && heatData && (
            <div className="self-stretch flex justify-end pointer-events-none">
              <HeatStoryPanel data={heatData} communeName={area.name} tubeDataset={tubeDataset} onFlyTo={flyTo} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
