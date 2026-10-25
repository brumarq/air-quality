"use client"

import { useState, useEffect } from "react"
import { MapContainer } from "@/components/map/map-container"
import { useMap } from "@/hooks/use-map"
import { getAirQualityStations } from "@/data/air-quality-stations"
import type { AirQualityStation } from "@/lib/types/air-quality"
import { CommuneConfig } from "@/data/communes"

interface MapLayoutProps {
  communeConfig: CommuneConfig
}

// One layout for both the Luxembourg-wide view and a single commune: full-bleed map with
// floating "islands" on top, no sidebar. The only difference between them is which area's
// config (station IDs, center, zoom) gets passed in - see data/communes.ts.
export function MapLayout({ communeConfig }: MapLayoutProps) {
  const [sidebarCollapsed] = useState(false)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data.filter((aqs) => communeConfig.stationIds.includes(Number(aqs.id))))
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setStationsLoaded(true)
      }
    }
    fetchStations()
  }, [communeConfig])

  const { mapContainer, map, mapLoaded } = useMap({
    stations,
    initialLng: communeConfig.center[0],
    initialLat: communeConfig.center[1],
    initialZoom: communeConfig.zoom,
    showNavigationControl: false,
  })

  return (
    stationsLoaded && (
      <div className="flex h-screen w-full">
        <MapContainer
          sidebarCollapsed={sidebarCollapsed}
          mapContainer={mapContainer}
          map={map}
          mapLoaded={mapLoaded}
          stations={stations}
          communeConfig={communeConfig}
        />
      </div>
    )
  )
}
