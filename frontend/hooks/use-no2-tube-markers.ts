"use client"

import { useEffect, useState } from "react"
import type mapboxgl from "mapbox-gl"
import type { NO2TubeDataset } from "@/domain/no2-tubes"
import { addNo2TubeLayers, removeNo2TubeLayers, NO2_TUBE_LAYER_ID } from "@/lib/utils/no2-tube-map-utils"

interface UseNo2TubeMarkersProps {
  map: mapboxgl.Map | null
  mapLoaded: boolean
  dataset: NO2TubeDataset | null
  visible: boolean
}

/**
 * Adds/removes the NO2 tube pins and handles clicking one, in a single effect so the
 * layer is guaranteed to exist before the click listener attaches to it.
 */
export function useNo2TubeMarkers({ map, mapLoaded, dataset, visible }: UseNo2TubeMarkersProps) {
  const [selectedTubeId, setSelectedTubeId] = useState<string | null>(null)

  useEffect(() => {
    if (!map || !mapLoaded) return

    if (!dataset || !visible) {
      removeNo2TubeLayers(map)
      setSelectedTubeId(null)
      return
    }

    addNo2TubeLayers(map, dataset)

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const id = e.features?.[0]?.properties?.id
      if (typeof id === "string") setSelectedTubeId(id)
    }
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ""
    }

    map.on("click", NO2_TUBE_LAYER_ID, handleClick)
    map.on("mouseenter", NO2_TUBE_LAYER_ID, handleMouseEnter)
    map.on("mouseleave", NO2_TUBE_LAYER_ID, handleMouseLeave)

    return () => {
      map.off("click", NO2_TUBE_LAYER_ID, handleClick)
      map.off("mouseenter", NO2_TUBE_LAYER_ID, handleMouseEnter)
      map.off("mouseleave", NO2_TUBE_LAYER_ID, handleMouseLeave)
      removeNo2TubeLayers(map)
    }
  }, [map, mapLoaded, dataset, visible])

  return { selectedTubeId, setSelectedTubeId }
}
