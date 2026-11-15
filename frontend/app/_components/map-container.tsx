"use client"

import type { Map as MapboxMap } from "mapbox-gl"
import { useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { CommuneReadingsPanel } from "@/features/air-quality/commune-readings-panel"
import { PollutantTrendChart } from "@/features/air-quality/pollutant-trend-chart"
import { RangePicker } from "@/features/air-quality/range-picker"
import { useAirQualityMode } from "@/features/air-quality/use-air-quality-mode"
import { HeatModeCards } from "@/features/heat/heat-mode-cards"
import { HeatStoryPanel } from "@/features/heat/heat-story-panel"
import { useHeatMode } from "@/features/heat/use-heat-mode"
import { No2TubesCards } from "@/features/no2-tubes/no2-tubes-cards"
import { useAreaTubes } from "@/features/no2-tubes/use-area-tubes"
import { useNo2TubeMarkers } from "@/features/no2-tubes/map"
import { CustomMapControls } from "./custom-map-controls"
import type { MapStatus } from "./use-mapbox-instance"
import type { AirQualityStation } from "@/features/air-quality/model"
import type { Area } from "@/content/area"
import type { LngLat } from "@/shared/domain/geo"
import type { AsyncState } from "@/shared/lib/use-async"
import { CommuneHeaderCard, type AreaMode } from "./commune-header-card"
import { HeatTubeCallout } from "./heat-tube-callout"
import { MapStatusOverlay } from "./map-status-overlay"
import { ReportCard } from "./report-card"

interface MapContainerProps {
  mapContainer: React.RefCallback<HTMLDivElement>
  map: MapboxMap | null
  mapStatus: MapStatus
  stations: AsyncState<AirQualityStation[]>
  area: Area
}

export function MapContainer({ mapContainer, map, mapStatus, stations, area }: MapContainerProps) {
  const commune = area.kind === "commune" ? area : null
  const [mode, setMode] = useState<AreaMode>("air")
  const tubes = useAreaTubes(commune?.datasets.no2Tubes ? commune.slug : null)
  const air = useAirQualityMode({ stations, active: mode === "air" })
  const tubeMarkers = useNo2TubeMarkers({
    map,
    dataset: tubes.status === "ready" ? tubes.dataset : null,
    visible: mode === "air",
  })
  const heat = useHeatMode({
    map,
    communeSlug: commune?.datasets.heat ? commune.slug : null,
    studyOverlay: commune?.studyOverlay ?? null,
    active: mode === "heat",
  })

  const flyTo = (lngLat: LngLat) => map?.flyTo({ center: [lngLat[0], lngLat[1]], zoom: 16 })
  const selectMode = (next: AreaMode) => {
    tubeMarkers.setSelectedTubeId(null)
    setMode(next)
  }

  return (
    <div className="relative flex-1 h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <MapStatusOverlay status={mapStatus} />

      <div className="absolute inset-4 flex gap-4 pointer-events-none">
        <div className="flex-none w-96 flex flex-col gap-4 pointer-events-none">
          <CommuneHeaderCard
            area={area}
            mode={mode}
            onSelectMode={selectMode}
            modeControls={mode === "air" && <RangePicker value={air.rangeKey} onChange={air.setRangeKey} />}
          />
          {mode === "air" ? (
            <>
              <CommuneReadingsPanel history={air.readings} selectedLimit={air.limit} range={air.range} onSelectParameter={air.setParameter} />
              <No2TubesCards tubes={tubes} selectedTubeId={tubeMarkers.selectedTubeId} onSelectTube={tubeMarkers.setSelectedTubeId} />
            </>
          ) : (
            <HeatModeCards
              load={heat.load}
              year={heat.year}
              selection={heat.selection}
              onBack={() => heat.setSelection(null)}
              studyOverlay={commune?.studyOverlay ?? null}
              onSelectYear={heat.pickYear}
              toggles={heat.toggles}
              onToggle={heat.setToggle}
            />
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
              <PollutantTrendChart history={air.readings} limit={air.limit} range={air.range} />
            </div>
          )}

          {mode === "heat" && heat.data && (
            <div className="self-stretch flex justify-end pointer-events-none">
              <HeatStoryPanel
                data={heat.data}
                communeName={area.name}
                study={commune?.heatStudy ?? null}
                industryNote={commune?.heatIndustryNote ?? null}
                onFlyTo={flyTo}
                callout={
                  commune?.heatTubeCallout && (
                    <HeatTubeCallout
                      callout={commune.heatTubeCallout}
                      heat={heat.data}
                      tubes={tubes.status === "ready" ? tubes.dataset : null}
                    />
                  )
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
