"use client"

import type { Map as MapboxMap } from "mapbox-gl"
import { useState } from "react"
import { type StudyOverlay, DEFAULT_HEAT_LAYER_TOGGLES, type HeatLayerToggles } from "./model"
import { useHeatMapLayers } from "./map"

interface UseHeatModeProps {
  map: MapboxMap | null
  communeSlug: string | null
  studyOverlay: StudyOverlay | null
  active: boolean
}

export function useHeatMode({ map, communeSlug, studyOverlay, active }: UseHeatModeProps) {
  const [toggles, setToggles] = useState<HeatLayerToggles>(DEFAULT_HEAT_LAYER_TOGGLES)
  const [pickedYear, setPickedYear] = useState<number | null>(null)

  const layers = useHeatMapLayers({ map, communeSlug, studyOverlay, visible: active, pickedYear, toggles })

  const setToggle = (key: keyof HeatLayerToggles, value: boolean) => setToggles((previous) => ({ ...previous, [key]: value }))

  return { ...layers, toggles, setToggle, pickYear: setPickedYear }
}
