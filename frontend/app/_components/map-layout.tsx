"use client"

import { getAreaStations } from "@/features/air-quality/api"
import { LUXEMBOURG } from "@/content/areas/luxembourg"
import { useStationLayers } from "@/features/air-quality/map"
import type { Area } from "@/content/area"
import { useAsync } from "@/shared/lib/use-async"
import { useBoundsOutline } from "./use-bounds-outline"
import { useMapboxInstance } from "./use-mapbox-instance"
import { MapContainer } from "./map-container"

export function MapLayout({ area }: { area: Area }) {
  const stations = useAsync(area.openAqLocationIds.join(","), (signal) => getAreaStations(area.openAqLocationIds, signal))

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
