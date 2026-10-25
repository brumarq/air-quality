"use client"

import type { AirQualityStation } from "@/lib/types/air-quality"
import type { CommuneConfig } from "@/data/communes"
import { SidebarHeader } from "./sidebar-header"
import { MapControls } from "./map-controls"
import { MetricsGrid } from "./metrics-grid"
import { StationCard } from "./station-card"
import { CommuneStations } from "./commune-stations"
import { CommuneSources } from "./commune-sources"
import { Legend } from "./legend"
import { SidebarFooter } from "./sidebar-footer"

interface SidebarProps {
  lng: number
  lat: number
  zoom: number
  selectedStation: AirQualityStation | null
  setSelectedStation: (station: AirQualityStation | null) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  stations: AirQualityStation[]
  communeConfig?: CommuneConfig
}

export function Sidebar({
  lng,
  lat,
  zoom,
  selectedStation,
  sidebarCollapsed,
  setSidebarCollapsed,
  stations,
  communeConfig,
}: SidebarProps) {
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div
      className={`h-full border-r bg-background flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-[75px]" : "w-80"
      }`}
    >
      <SidebarHeader sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      {!sidebarCollapsed && (
        <>
          <MapControls />

          {communeConfig ? (
            <>
              <CommuneStations stations={stations} />
              <CommuneSources />
            </>
          ) : (
            <MetricsGrid />
          )}

          {selectedStation && (
            <div className="p-5 border-b">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Selected Station</h2>
              <StationCard station={selectedStation} />
            </div>
          )}

          <Legend />

          <SidebarFooter lng={lng} lat={lat} zoom={zoom} />
        </>
      )}
    </div>
  )
}

