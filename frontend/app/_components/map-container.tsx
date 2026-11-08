"use client"

import { useState } from "react"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { PollutantTrendChart } from "@/features/air-quality"
import { HeatStoryPanel } from "@/features/heat"
import { CustomMapControls } from "@/map/custom-map-controls"
import type { MapStatus } from "@/map/use-mapbox-instance"
import type { AirQualityStation } from "@/domain/air-quality"
import type { Area } from "@/domain/area"
import type { LngLat } from "@/domain/shared/geo"
import type { AsyncState } from "@/lib/use-async"
import { AirModeCards } from "./air-mode-cards"
import { CommuneHeaderCard, type AreaMode } from "./commune-header-card"
import { HeatModeCards } from "./heat-mode-cards"
import { HeatTubeCallout } from "./heat-tube-callout"
import { MapStatusOverlay } from "./map-status-overlay"
import { ReportCard } from "./report-card"
import { useAirMode } from "./use-air-mode"
import { useAreaTubes } from "./use-area-tubes"
import { useHeatMode } from "./use-heat-mode"

interface MapContainerProps {
  mapContainer: React.RefCallback<HTMLDivElement>
  map: mapboxgl.Map | null
  mapStatus: MapStatus
  stations: AsyncState<AirQualityStation[]>
  area: Area
}

/** The map plus its floating cards. Each mode's state lives in its own hook. */
export function MapContainer({ mapContainer, map, mapStatus, stations, area }: MapContainerProps) {
  const commune = area.kind === "commune" ? area : null
  const [mode, setMode] = useState<AreaMode>("air")
  const tubes = useAreaTubes(area)
  const air = useAirMode({ map, stations, tubes, active: mode === "air" })
  const heat = useHeatMode({ map, commune, active: mode === "heat" })

  const flyTo = (lngLat: LngLat) => map?.flyTo({ center: [lngLat[0], lngLat[1]], zoom: 16 })
  const selectMode = (next: AreaMode) => {
    // Leaving air mode closes the tube detail.
    air.setSelectedTubeId(null)
    setMode(next)
  }

  return (
    <div className="relative flex-1 h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <MapStatusOverlay status={mapStatus} />

      {/* Floating cards: the outer grid is pointer-events-none so the map stays draggable
          between cards; each card opts back in with pointer-events-auto. */}
      <div className="absolute inset-4 flex gap-4 pointer-events-none">
        <div className="flex-none w-96 flex flex-col gap-4 pointer-events-none">
          <CommuneHeaderCard
            area={area}
            mode={mode}
            onSelectMode={selectMode}
            selectedRangeKey={air.rangeKey}
            onSelectRange={air.setRangeKey}
          />
          {mode === "air" ? <AirModeCards air={air} tubes={tubes} /> : <HeatModeCards heat={heat} commune={commune} />}
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
