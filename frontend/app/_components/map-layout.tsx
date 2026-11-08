"use client"

import { useState, useEffect } from "react"
import { MapContainer } from "./map-container"
import { useMapboxInstance } from "@/map/use-mapbox-instance"
import { useLuxembourgBoundary } from "@/map/luxembourg-boundary"
import { useStationLayers } from "@/features/air-quality"
import { getAirQualityStations } from "@/api/air-quality"
import type { AirQualityStation } from "@/domain/air-quality"
import type { Area } from "@/domain/area"

interface MapLayoutProps {
  area: Area
}

// One layout for the national overview and every commune: a full-bleed map with floating
// cards on top. What differs is the area passed in (stations, map view, datasets).
export function MapLayout({ area }: MapLayoutProps) {
  const [sidebarCollapsed] = useState(false)
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [stationsLoaded, setStationsLoaded] = useState(false)

  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data.filter((aqs) => area.stationIds.includes(aqs.id)))
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setStationsLoaded(true)
      }
    }
    fetchStations()
  }, [area])

  const { containerRef, map, status: mapStatus } = useMapboxInstance({
    center: [area.center[0], area.center[1]],
    zoom: area.zoom,
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
          area={area}
        />
      </div>
    )
  )
}
