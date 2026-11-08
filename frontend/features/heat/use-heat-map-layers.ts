"use client"

import { useMemo, useRef, useState } from "react"
import type mapboxgl from "mapbox-gl"
import { fetchHeatMapData } from "@/api/heat"
import type { LoadResult } from "@/api/static-data"
import { latestHeatYear, type HeatMapData, type StudyOverlay } from "@/domain/heat"
import { featureProperties } from "@/map/feature-properties"
import { useMapLayer } from "@/map/use-map-layer"
import { wmsTileUrl } from "@/map/wms"
import { useAsync, type AsyncState } from "@/lib/use-async"
import {
  BuildingFeatureProperties,
  CellFeatureProperties,
  HEAT_BOUNDARY_LAYERS,
  HEAT_BOUNDARY_SOURCE_ID,
  HEAT_BUILDINGS_LAYER_ID,
  HEAT_BUILDINGS_LAYERS,
  HEAT_BUILDINGS_SOURCE_ID,
  HEAT_GRID_FILL_LAYER_ID,
  HEAT_GRID_LAYERS,
  HEAT_GRID_SOURCE_ID,
  HEAT_NDVI_FILL_LAYER_ID,
  HEAT_NDVI_LAYERS,
  HEAT_NDVI_SOURCE_ID,
  STUDY_OVERLAY_LAYERS,
  STUDY_OVERLAY_SOURCE_ID,
  anomalyFillExpression,
  buildingsGeoJson,
  heatGridGeoJson,
  ndviFillExpression,
} from "./heat-layers"

export interface HeatLayerToggles {
  grid: boolean
  ndvi: boolean
  buildings: boolean
  studyOverlay: boolean
}

/** What the user clicked on the heat map: a grid cell or a sensitive building. */
export type HeatSelection = { type: "cell"; id: string } | { type: "building"; id: string }

interface UseHeatMapLayersProps {
  map: mapboxgl.Map | null
  /** null when the area has no heat data; nothing is fetched and it reads as not prepared. */
  communeSlug: string | null
  studyOverlay: StudyOverlay | null
  visible: boolean
  /** The summer the user picked, or null for the latest one in the data. */
  pickedYear: number | null
  toggles: HeatLayerToggles
}

const NOT_PREPARED: AsyncState<LoadResult<HeatMapData>> = { status: "ready", data: { status: "not-prepared" } }

const setCursor = (map: mapboxgl.Map | null, cursor: string) => {
  if (map) map.getCanvas().style.cursor = cursor
}

/**
 * Loads a commune's heat data while heat mode is shown, and draws each heat layer while its
 * toggle is on. The commune boundary shows whenever heat mode is on: it's orientation, not
 * a layer worth its own switch.
 */
export function useHeatMapLayers({ map, communeSlug, studyOverlay, visible, pickedYear, toggles }: UseHeatMapLayersProps) {
  const fetched = useAsync(visible && communeSlug ? `heat|${communeSlug}` : null, (signal) =>
    fetchHeatMapData(communeSlug ?? "", signal),
  )
  const load = communeSlug === null ? NOT_PREPARED : fetched
  const data = visible && load.status === "ready" && load.data.status === "ok" ? load.data.data : null
  const year = data && pickedYear !== null && data.years.includes(pickedYear) ? pickedYear : data && latestHeatYear(data)

  const [selection, setSelection] = useState<HeatSelection | null>(null)
  const hoveredCellRef = useRef<string | number | null>(null)

  const grid = useMemo(() => (data ? heatGridGeoJson(data.cells) : null), [data])
  const buildings = useMemo(() => (data ? buildingsGeoJson(data.buildings) : null), [data])

  const setHoveredCell = (id: string | number | null) => {
    if (!map) return
    const previous = hoveredCellRef.current
    if (previous !== null && previous !== id) map.setFeatureState({ source: HEAT_GRID_SOURCE_ID, id: previous }, { hover: false })
    if (id !== null) map.setFeatureState({ source: HEAT_GRID_SOURCE_ID, id }, { hover: true })
    hoveredCellRef.current = id
  }

  useMapLayer(map, {
    sourceId: HEAT_GRID_SOURCE_ID,
    data: toggles.grid ? grid : null,
    // promoteId lets feature-state (the hover outline) key off our cell id, which lives
    // in properties.id; these GeoJSON features have no top-level id.
    source: (geojson) => ({ type: "geojson", data: geojson, promoteId: "id" }),
    layers: HEAT_GRID_LAYERS,
    paint: year === null ? {} : { [HEAT_GRID_FILL_LAYER_ID]: { "fill-color": anomalyFillExpression(year) } },
    events: {
      [HEAT_GRID_FILL_LAYER_ID]: {
        click: (event) => {
          const cell = featureProperties(event, CellFeatureProperties)
          if (cell) setSelection({ type: "cell", id: cell.id })
        },
        mousemove: (event) => {
          const id = event.features?.[0]?.id
          if (id === undefined) return
          setHoveredCell(id)
          setCursor(map, "pointer")
        },
        mouseleave: () => {
          setHoveredCell(null)
          setCursor(map, "")
        },
      },
    },
  })

  // NDVI is finer than the thermal grid at source (Sentinel-2 10m vs. Landsat thermal
  // 100m), but the pipeline exports it already averaged into the same 100m cells.
  useMapLayer(map, {
    sourceId: HEAT_NDVI_SOURCE_ID,
    data: toggles.ndvi ? grid : null,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: HEAT_NDVI_LAYERS,
    paint: year === null ? {} : { [HEAT_NDVI_FILL_LAYER_ID]: { "fill-color": ndviFillExpression(year) } },
  })

  useMapLayer(map, {
    sourceId: HEAT_BOUNDARY_SOURCE_ID,
    data: data?.boundary ?? null,
    source: (feature) => ({ type: "geojson", data: feature }),
    layers: HEAT_BOUNDARY_LAYERS,
  })

  useMapLayer(map, {
    sourceId: HEAT_BUILDINGS_SOURCE_ID,
    data: toggles.buildings ? buildings : null,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: HEAT_BUILDINGS_LAYERS,
    events: {
      [HEAT_BUILDINGS_LAYER_ID]: {
        click: (event) => {
          const building = featureProperties(event, BuildingFeatureProperties)
          if (building) setSelection({ type: "building", id: building.osmId })
        },
        mouseenter: () => setCursor(map, "pointer"),
        mouseleave: () => setCursor(map, ""),
      },
    },
  })

  // An external tile source, so it doesn't wait for the heat data.
  useMapLayer(map, {
    sourceId: STUDY_OVERLAY_SOURCE_ID,
    data: visible && toggles.studyOverlay ? studyOverlay : null,
    source: (overlay) => ({ type: "raster", tiles: [wmsTileUrl(overlay.wmsUrl, overlay.wmsLayer)], tileSize: 256 }),
    layers: STUDY_OVERLAY_LAYERS,
  })

  return { load, data, year, selection: visible ? selection : null, setSelection }
}
