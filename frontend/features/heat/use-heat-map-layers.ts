"use client"

import { useEffect, useRef, useState } from "react"
import { useAsync, type AsyncState } from "@/lib/use-async"
import type { LoadResult } from "@/api/static-data"
import type { HeatMapData } from "@/domain/heat"
import type mapboxgl from "mapbox-gl"
import { fetchHeatMapData } from "@/api/heat"
import {
  addHeatGridLayer,
  removeHeatGridLayer,
  setHeatGridYear,
  addHeatBoundaryLayer,
  removeHeatBoundaryLayer,
  addHeatBuildingsLayer,
  removeHeatBuildingsLayer,
  addHeatNdviLayer,
  removeHeatNdviLayer,
  setHeatNdviYear,
  addProsudWmsLayer,
  removeProsudWmsLayer,
  HEAT_GRID_FILL_LAYER_ID,
  HEAT_GRID_SOURCE_ID,
  HEAT_BUILDINGS_LAYER_ID,
} from "./heat-layers"

export interface HeatLayerToggles {
  grid: boolean
  ndvi: boolean
  buildings: boolean
  prosudWms: boolean
}

interface UseHeatMapLayersProps {
  map: mapboxgl.Map | null
  mapLoaded: boolean
  /** null when the area has no heat data; the load is skipped and treated as not prepared. */
  communeSlug: string | null
  visible: boolean
  year: number
  toggles: HeatLayerToggles
}

/**
 * Loads the static heat-map data once per commune, then adds/removes each layer
 * independently as its toggle flips - see ESCH-HEAT-PROFILE-PLAN.md Step 3, Week 2.
 */
const NOT_PREPARED: AsyncState<LoadResult<HeatMapData>> = { status: "ready", data: { status: "not-prepared" } }

export function useHeatMapLayers({ map, mapLoaded, communeSlug, visible, year, toggles }: UseHeatMapLayersProps) {
  const fetched = useAsync(visible && communeSlug ? `heat|${communeSlug}` : null, (signal) =>
    fetchHeatMapData(communeSlug ?? "", signal),
  )
  const load = communeSlug === null ? NOT_PREPARED : fetched
  const data = load.status === "ready" && load.data.status === "ok" ? load.data.data : null
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const hoveredIdRef = useRef<string | number | null>(null)

  // Grid fill + hover + click. One effect for all three so the layer is guaranteed to
  // exist before listeners attach (same reasoning as use-no2-tube-markers.ts).
  useEffect(() => {
    if (!map || !mapLoaded) return
    if (!data || !visible || !toggles.grid) {
      removeHeatGridLayer(map)
      return
    }

    addHeatGridLayer(map, data, year)

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const id = e.features?.[0]?.properties?.id
      if (typeof id === "string") {
        setSelectedCellId(id)
        setSelectedBuildingId(null)
      }
    }
    const handleMouseMove = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const feature = e.features?.[0]
      if (!feature || feature.id === undefined) return
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== feature.id) {
        map.setFeatureState({ source: HEAT_GRID_SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
      }
      map.setFeatureState({ source: HEAT_GRID_SOURCE_ID, id: feature.id }, { hover: true })
      hoveredIdRef.current = feature.id
      map.getCanvas().style.cursor = "pointer"
    }
    const handleMouseLeave = () => {
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: HEAT_GRID_SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
        hoveredIdRef.current = null
      }
      map.getCanvas().style.cursor = ""
    }

    map.on("click", HEAT_GRID_FILL_LAYER_ID, handleClick)
    map.on("mousemove", HEAT_GRID_FILL_LAYER_ID, handleMouseMove)
    map.on("mouseleave", HEAT_GRID_FILL_LAYER_ID, handleMouseLeave)

    return () => {
      map.off("click", HEAT_GRID_FILL_LAYER_ID, handleClick)
      map.off("mousemove", HEAT_GRID_FILL_LAYER_ID, handleMouseMove)
      map.off("mouseleave", HEAT_GRID_FILL_LAYER_ID, handleMouseLeave)
      removeHeatGridLayer(map)
    }
    // year is intentionally not a dependency here - it's applied via setHeatGridYear
    // below without re-adding the whole layer (and its listeners) on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, data, visible, toggles.grid])

  useEffect(() => {
    if (!map || !mapLoaded || !data || !visible || !toggles.grid) return
    setHeatGridYear(map, year)
  }, [map, mapLoaded, data, visible, toggles.grid, year])

  // NDVI fill.
  useEffect(() => {
    if (!map || !mapLoaded) return
    if (!data || !visible || !toggles.ndvi) {
      removeHeatNdviLayer(map)
      return
    }
    addHeatNdviLayer(map, data, year)
    return () => removeHeatNdviLayer(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, data, visible, toggles.ndvi])

  useEffect(() => {
    if (!map || !mapLoaded || !data || !visible || !toggles.ndvi) return
    setHeatNdviYear(map, year)
  }, [map, mapLoaded, data, visible, toggles.ndvi, year])

  // Commune boundary outline - tied to the grid toggle, not its own switch; it's
  // orientation context, not a layer worth a dedicated checkbox.
  useEffect(() => {
    if (!map || !mapLoaded) return
    if (!data || !visible) {
      removeHeatBoundaryLayer(map)
      return
    }
    addHeatBoundaryLayer(map, data)
    return () => removeHeatBoundaryLayer(map)
  }, [map, mapLoaded, data, visible])

  // Sensitive buildings + click.
  useEffect(() => {
    if (!map || !mapLoaded) return
    if (!data || !visible || !toggles.buildings) {
      removeHeatBuildingsLayer(map)
      return
    }

    addHeatBuildingsLayer(map, data)

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const id = e.features?.[0]?.properties?.osmId
      if (typeof id === "string") {
        setSelectedBuildingId(id)
        setSelectedCellId(null)
      }
    }
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ""
    }

    map.on("click", HEAT_BUILDINGS_LAYER_ID, handleClick)
    map.on("mouseenter", HEAT_BUILDINGS_LAYER_ID, handleMouseEnter)
    map.on("mouseleave", HEAT_BUILDINGS_LAYER_ID, handleMouseLeave)

    return () => {
      map.off("click", HEAT_BUILDINGS_LAYER_ID, handleClick)
      map.off("mouseenter", HEAT_BUILDINGS_LAYER_ID, handleMouseEnter)
      map.off("mouseleave", HEAT_BUILDINGS_LAYER_ID, handleMouseLeave)
      removeHeatBuildingsLayer(map)
    }
  }, [map, mapLoaded, data, visible, toggles.buildings])

  // PRO-SUD WMS raster - no data dependency, it's an external tile source.
  useEffect(() => {
    if (!map || !mapLoaded) return
    if (!visible || !toggles.prosudWms) {
      removeProsudWmsLayer(map)
      return
    }
    addProsudWmsLayer(map)
    return () => removeProsudWmsLayer(map)
  }, [map, mapLoaded, visible, toggles.prosudWms])

  return { load, data, selectedCellId, setSelectedCellId, selectedBuildingId, setSelectedBuildingId }
}
