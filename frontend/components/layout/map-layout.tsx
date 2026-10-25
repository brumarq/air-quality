"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MapContainer } from "@/components/map/map-container"
import { useMap } from "@/hooks/use-map"
import { getAirQualityStations } from "@/data/air-quality-stations"
import type { AirQualityStation } from "@/lib/types/air-quality"
import { CommuneConfig } from "@/data/communes"

interface MapLayoutProps {
  communeConfig?: CommuneConfig
}

export function MapLayout({communeConfig}: MapLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  // Load stations
  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()

        const scoped = communeConfig 
          ? data.filter((aqs) => communeConfig.stationIds.includes(Number(aqs.id)))
          : data

          setStations(scoped)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setStationsLoaded(true)
      }
    }
    fetchStations()
  }, [communeConfig])

  const { mapContainer, map, lng, lat, zoom, selectedStation, setSelectedStation, mapLoaded } = useMap({
    stations,
    initialLng: communeConfig?.center[0], 
    initialLat: communeConfig?.center[1], 
    initialZoom: communeConfig?.zoom,
  })

  return (
    (stationsLoaded) && (
      <div className="flex h-screen w-full">
        <Sidebar
          lng={lng}
          lat={lat}
          zoom={zoom}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          communeConfig={communeConfig}
        />
        <MapContainer
          sidebarCollapsed={sidebarCollapsed}
          mapContainer={mapContainer}
          map={map}
          mapLoaded={mapLoaded}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          stations={stations}
          communeConfig={communeConfig}
        />
      </div>
    )
  )
}

