"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MapContainer } from "@/components/map/map-container"
import { useMap } from "@/hooks/use-map"
import { airQualityStations } from "@/data/air-quality-stations"

export function MapLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state after component mounts
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])


  const { lng, lat, zoom, heatmapVisible, selectedStation, toggleHeatmap } = useMap({
    stations: airQualityStations,
  })

  // Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        lng={lng}
        lat={lat}
        zoom={zoom}
        heatmapVisible={heatmapVisible}
        selectedStation={selectedStation}
        toggleHeatmap={toggleHeatmap}
      />
      <MapContainer sidebarCollapsed={sidebarCollapsed} />
    </div>
  )
}

