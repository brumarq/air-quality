"use client"

import { getAreaStations } from "@/api/air-quality"
import { LUXEMBOURG } from "@/content/areas/luxembourg"
import { useStationLayers } from "@/features/air-quality"
import type { Area } from "@/domain/area"
import { useAsync } from "@/lib/use-async"
import { useBoundsOutline } from "@/map/use-bounds-outline"
import { useMapboxInstance } from "@/map/use-mapbox-instance"
import { MapContainer } from "./map-container"

// One layout for the national overview and every commune: a full-bleed map with floating
// cards on top. What differs is the area passed in (stations, map view, datasets).
export function MapLayout({ area }: { area: Area }) {
  const stations = useAsync(area.stationIds.join(","), (signal) => getAreaStations(area.stationIds, signal))

  const { containerRef, map, status: mapStatus } = useMapboxInstance({
    center: [area.center[0], area.center[1]],
    zoom: area.zoom,
  })
  useBoundsOutline(map, LUXEMBOURG.bounds)
  useStationLayers(map, stations.status === "ready" ? stations.data : NO_STATIONS)

  return (
    <div className="flex h-screen w-full">
      <MapContainer mapContainer={containerRef} map={map} mapStatus={mapStatus} stations={stations} area={area} />
    </div>
  )
}

const NO_STATIONS: [] = []
