"use client"

import { useState } from "react"
import type mapboxgl from "mapbox-gl"
import { useHeatMapLayers, type HeatLayerToggles } from "@/features/heat"
import type { CommuneArea } from "@/domain/area"

// Grid and buildings are on by default; NDVI and the study overlay are off to avoid clutter.
const DEFAULT_TOGGLES: HeatLayerToggles = { grid: true, ndvi: false, buildings: true, studyOverlay: false }

/** Heat mode's state: the layer toggles, the picked summer, and the heat layers themselves. */
export function useHeatMode({ map, commune, active }: { map: mapboxgl.Map | null; commune: CommuneArea | null; active: boolean }) {
  const [toggles, setToggles] = useState<HeatLayerToggles>(DEFAULT_TOGGLES)
  const [pickedYear, setPickedYear] = useState<number | null>(null)

  const layers = useHeatMapLayers({
    map,
    communeSlug: commune?.datasets.heat ? commune.slug : null,
    studyOverlay: commune?.studyOverlay ?? null,
    visible: active,
    pickedYear,
    toggles,
  })

  const setToggle = (key: keyof HeatLayerToggles, value: boolean) => setToggles((previous) => ({ ...previous, [key]: value }))

  return { ...layers, toggles, setToggle, pickYear: setPickedYear }
}
