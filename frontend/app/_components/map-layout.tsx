"use client"

import { useState, useEffect } from "react"
import { MapContainer } from "./map-container"
import { useMapboxInstance } from "@/map/use-mapbox-instance"
import { useLuxembourgBoundary } from "@/map/luxembourg-boundary"
import { useStationLayers } from "@/features/air-quality"
import { getAirQualityStations } from "@/api/air-quality"
import type { AirQualityStation } from "@/domain/air-quality"
import { CommuneConfig } from "@/domain/communes"

interface MapLayoutProps {
  communeConfig: CommuneConfig
}

// One layout for both the Luxembourg-wide view and a single commune: full-bleed map with
// floating "islands" on top, no sidebar. The only difference between them is which area's
// config (station IDs, center, zoom) gets passed in - see domain/communes.ts.
export function MapLayout({ communeConfig }: MapLayoutProps) {
  const [sidebarCollapsed] = useState(false)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data.filter((aqs) => communeConfig.stationIds.includes(aqs.id)))
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setStationsLoaded(true)
      }
    }
    fetchStations()
  }, [communeConfig])

  const { containerRef, map, status: mapStatus } = useMapboxInstance({
    center: communeConfig.center,
    zoom: communeConfig.zoom,
  })
  const mapLoaded = map !== null
  useLuxembourgBoundary(map, mapLoaded)
  useStationLayers(map, mapLoaded, stations)

  return (
    stationsLoaded && (
      <div className="flex h-screen w-full">
        <MapContainer
          sidebarCollapsed={sidebarCollapsed}
          mapContainer={containerRef}
          map={map}
          mapStatus={mapStatus}
          stations={stations}
          communeConfig={communeConfig}
        />
      </div>
    )
  )
}
