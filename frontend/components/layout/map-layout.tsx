"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MapContainer } from "@/components/map/map-container"
import { useMap } from "@/hooks/use-map"
import { getAirQualityStations } from "@/data/air-quality-stations"
import type { AirQualityStation } from "@/lib/types/air-quality"

export function MapLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  // Load stations
  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setStationsLoaded(true)
      }
    }
    fetchStations()
  }, [])

  const { mapContainer, map, lng, lat, zoom, selectedStation, setSelectedStation, mapLoaded } = useMap({
    stations,
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
        />
        <MapContainer 
          sidebarCollapsed={sidebarCollapsed}
          mapContainer={mapContainer}
          map={map}
          mapLoaded={mapLoaded}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
        />
      </div>
    )
  )
}

