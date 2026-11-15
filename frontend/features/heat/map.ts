"use client"

import type { Expression, LayerSpecification, Map as MapboxMap } from "mapbox-gl"
import { z } from "zod"
import { BUILDING_KINDS, type BuildingKind, latestHeatYear, type HeatMapData, type StudyOverlay, type HeatLayerToggles, type HeatSelection } from "./model"
import { tokens } from "@/shared/theme/tokens"
import { useRef, useState } from "react"
import { fetchHeatMapData } from "./api"
import type { LoadResult } from "@/shared/lib/static-data"
import { firstFeatureProperties } from "@/shared/map/feature-properties"
import { useMapLayer } from "@/shared/map/use-map-layer"
import { useAsync, type AsyncState } from "@/shared/lib/use-async"

const HEAT_GRID_SOURCE_ID = "heat-grid-data"
const HEAT_GRID_FILL_LAYER_ID = "heat-grid-fill"
const HEAT_GRID_OUTLINE_LAYER_ID = "heat-grid-outline"
const HEAT_NDVI_SOURCE_ID = "heat-ndvi-data"
const HEAT_NDVI_FILL_LAYER_ID = "heat-ndvi-fill"
const HEAT_BOUNDARY_SOURCE_ID = "heat-boundary-data"
const HEAT_BOUNDARY_LAYER_ID = "heat-boundary-outline"
const HEAT_BUILDINGS_SOURCE_ID = "heat-buildings-data"
const HEAT_BUILDINGS_LAYER_ID = "heat-buildings-markers"
const STUDY_OVERLAY_SOURCE_ID = "heat-study-overlay-data"
const STUDY_OVERLAY_LAYER_ID = "heat-study-overlay-layer"

const BUILDING_KIND_COLOR: Record<BuildingKind, string> = {
  school: tokens.heat.building.school,
  kindergarten: tokens.heat.building.kindergarten,
  care_facility: tokens.heat.building.careFacility,
}

const CellFeatureProperties = z.object({ id: z.string() })
const BuildingFeatureProperties = z.object({ osm_id: z.string() })

export function anomalyFillExpression(year: number): Expression {
  const value = ["get", `anomaly_c_${year}`]
  return ["case", ["==", value, null], tokens.chart.noData, ["interpolate", ["linear"], value, ...tokens.heat.anomaly.flat()]]
}

function ndviFillExpression(year: number): Expression {
  return ["interpolate", ["linear"], ["coalesce", ["get", `ndvi_${year}`], -1], ...tokens.heat.ndvi.flat()]
}

const HEAT_GRID_LAYERS: LayerSpecification[] = [
  { id: HEAT_GRID_FILL_LAYER_ID, type: "fill", source: HEAT_GRID_SOURCE_ID, paint: { "fill-opacity": 0.75 } },
  {
    id: HEAT_GRID_OUTLINE_LAYER_ID,
    type: "line",
    source: HEAT_GRID_SOURCE_ID,
    paint: {
      "line-color": tokens.heat.gridOutline,
      "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.2],
      "line-opacity": 0.5,
    },
  },
]

const HEAT_NDVI_LAYERS: LayerSpecification[] = [
  { id: HEAT_NDVI_FILL_LAYER_ID, type: "fill", source: HEAT_NDVI_SOURCE_ID, paint: { "fill-opacity": 0.75 } },
]

const HEAT_BOUNDARY_LAYERS: LayerSpecification[] = [
  {
    id: HEAT_BOUNDARY_LAYER_ID,
    type: "line",
    source: HEAT_BOUNDARY_SOURCE_ID,
    paint: { "line-color": tokens.heat.communeBoundary, "line-width": 2, "line-dasharray": [2, 1] },
  },
]

export const HEAT_BUILDINGS_LAYERS: LayerSpecification[] = [
  {
    id: HEAT_BUILDINGS_LAYER_ID,
    type: "circle",
    source: HEAT_BUILDINGS_SOURCE_ID,
    paint: {
      "circle-radius": 6,
      "circle-color": [
        "match",
        ["get", "kind"],
        ...BUILDING_KINDS.flatMap((kind) => [kind, BUILDING_KIND_COLOR[kind]]),
        tokens.heat.building.other,
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": tokens.heat.building.stroke,
    },
  },
]

const STUDY_OVERLAY_LAYERS: LayerSpecification[] = [
  { id: STUDY_OVERLAY_LAYER_ID, type: "raster", source: STUDY_OVERLAY_SOURCE_ID, paint: { "raster-opacity": 0.8 } },
]

interface UseHeatMapLayersProps {
  map: MapboxMap | null
  communeSlug: string | null
  studyOverlay: StudyOverlay | null
  visible: boolean
  pickedYear: number | null
  toggles: HeatLayerToggles
}

const NOT_PREPARED: AsyncState<LoadResult<HeatMapData>> = { status: "ready", data: { status: "not-prepared" } }

const setCursor = (map: MapboxMap | null, cursor: string) => {
  if (map) map.getCanvas().style.cursor = cursor
}

export function useHeatMapLayers({ map, communeSlug, studyOverlay, visible, pickedYear, toggles }: UseHeatMapLayersProps) {
  const fetched = useAsync(visible && communeSlug ? `heat|${communeSlug}` : null, (signal) =>
    fetchHeatMapData(communeSlug ?? "", signal),
  )
  const load = communeSlug === null ? NOT_PREPARED : fetched
  const data = visible && load.status === "ready" && load.data.status === "ok" ? load.data.data : null
  const year = data && pickedYear !== null && data.years.includes(pickedYear) ? pickedYear : data && latestHeatYear(data)

  const [selection, setSelection] = useState<HeatSelection | null>(null)
  const hoveredCellRef = useRef<string | number | null>(null)

  const grid = data?.gridGeoJson ?? null
  const buildings = data?.buildingsGeoJson ?? null

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
    source: (geojson) => ({ type: "geojson", data: geojson, promoteId: "id" }),
    layers: HEAT_GRID_LAYERS,
    paint: year === null ? {} : { [HEAT_GRID_FILL_LAYER_ID]: { "fill-color": anomalyFillExpression(year) } },
    events: {
      [HEAT_GRID_FILL_LAYER_ID]: {
        click: (event) => {
          const cell = firstFeatureProperties(event, CellFeatureProperties)
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
          const building = firstFeatureProperties(event, BuildingFeatureProperties)
          if (building) setSelection({ type: "building", id: building.osm_id })
        },
        mouseenter: () => setCursor(map, "pointer"),
        mouseleave: () => setCursor(map, ""),
      },
    },
  })

  useMapLayer(map, {
    sourceId: STUDY_OVERLAY_SOURCE_ID,
    data: visible && toggles.studyOverlay ? studyOverlay : null,
    source: (overlay) => ({ type: "raster", tiles: [wmsTileUrl(overlay.wmsUrl, overlay.wmsLayer)], tileSize: 256 }),
    layers: STUDY_OVERLAY_LAYERS,
  })

  return { load, data, year, selection: visible ? selection : null, setSelection }
}

function wmsTileUrl(serviceUrl: string, layer: string): string {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: layer,
    STYLES: "",
    CRS: "EPSG:3857",
    WIDTH: "256",
    HEIGHT: "256",
    FORMAT: "image/png",
    TRANSPARENT: "true",
  })
  return `${serviceUrl}?${params.toString()}&BBOX={bbox-epsg-3857}`
}
