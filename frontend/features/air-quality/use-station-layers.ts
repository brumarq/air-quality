"use client"

import { useEffect } from "react"
import type mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/domain/air-quality"
import { addAirQualityLayers, STATION_LAYER_ID } from "./station-layers"

const MARKER_RADIUS = 10
const MARKER_RADIUS_HOVER = 12

/**
 * Draws station markers and labels, keeps them in sync with `stations`, and flies to a
 * station when it's clicked.
 */
export function useStationLayers(map: mapboxgl.Map | null, mapLoaded: boolean, stations: AirQualityStation[]) {
  // Adds the layers on first run; later runs only replace the source data.
  useEffect(() => {
    if (!map || !mapLoaded) return
    addAirQualityLayers(map, stations)
  }, [map, mapLoaded, stations])

  useEffect(() => {
    if (!map || !mapLoaded || stations.length === 0) return

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const feature = e.features?.[0]
      const id = feature?.properties?.id
      if (!feature || !stations.some((s) => s.id === id)) return
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 11.5),
        duration: 1000,
        essential: true,
      })
    }
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
      map.setPaintProperty(STATION_LAYER_ID, "circle-radius", MARKER_RADIUS_HOVER)
    }
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ""
      map.setPaintProperty(STATION_LAYER_ID, "circle-radius", MARKER_RADIUS)
    }

    map.on("click", STATION_LAYER_ID, handleClick)
    map.on("mouseenter", STATION_LAYER_ID, handleMouseEnter)
    map.on("mouseleave", STATION_LAYER_ID, handleMouseLeave)
    return () => {
      map.off("click", STATION_LAYER_ID, handleClick)
      map.off("mouseenter", STATION_LAYER_ID, handleMouseEnter)
      map.off("mouseleave", STATION_LAYER_ID, handleMouseLeave)
    }
  }, [map, mapLoaded, stations])
}
