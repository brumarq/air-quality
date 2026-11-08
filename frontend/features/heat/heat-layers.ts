import type { Expression, LayerSpecification } from "mapbox-gl"
import { z } from "zod"
import type { HeatCell, SensitiveBuilding } from "@/domain/heat"
import { tokens } from "@/theme/tokens"

export const HEAT_GRID_SOURCE_ID = "heat-grid-data"
export const HEAT_GRID_FILL_LAYER_ID = "heat-grid-fill"
export const HEAT_GRID_OUTLINE_LAYER_ID = "heat-grid-outline"
export const HEAT_NDVI_SOURCE_ID = "heat-ndvi-data"
export const HEAT_NDVI_FILL_LAYER_ID = "heat-ndvi-fill"
export const HEAT_BOUNDARY_SOURCE_ID = "heat-boundary-data"
export const HEAT_BOUNDARY_LAYER_ID = "heat-boundary-outline"
export const HEAT_BUILDINGS_SOURCE_ID = "heat-buildings-data"
export const HEAT_BUILDINGS_LAYER_ID = "heat-buildings-markers"
export const STUDY_OVERLAY_SOURCE_ID = "heat-study-overlay-data"
export const STUDY_OVERLAY_LAYER_ID = "heat-study-overlay-layer"

// Feature property names the paint expressions read. Per-year values are flattened onto
// each feature because Mapbox expressions can only read plain properties.
const anomalyProperty = (year: number) => `anomaly-${year}`
const ndviProperty = (year: number) => `ndvi-${year}`

export const CellFeatureProperties = z.object({ id: z.string() })
export const BuildingFeatureProperties = z.object({ osmId: z.string() })

export function heatGridGeoJson(cells: HeatCell[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: cells.map((cell) => ({
      type: "Feature",
      geometry: cell.polygon,
      properties: {
        id: cell.id,
        ...Object.fromEntries(cell.years.flatMap((y) => [[anomalyProperty(y.year), y.anomalyC], [ndviProperty(y.year), y.ndvi]])),
      },
    })),
  }
}

export function buildingsGeoJson(buildings: SensitiveBuilding[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: buildings.map((b) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [b.lngLat[0], b.lngLat[1]] },
      properties: { osmId: b.osmId, kind: b.kind } satisfies z.infer<typeof BuildingFeatureProperties> & { kind: string },
    })),
  }
}

/** Anomaly colour for a year: the same stops as the legend and the detail card. Missing is grey. */
export function anomalyFillExpression(year: number): Expression {
  const value = ["get", anomalyProperty(year)]
  return ["case", ["==", value, null], tokens.chart.noData, ["interpolate", ["linear"], value, ...tokens.heat.anomaly.flat()]]
}

/** NDVI colour for a year; a missing value reads as the lowest stop. */
export function ndviFillExpression(year: number): Expression {
  return ["interpolate", ["linear"], ["coalesce", ["get", ndviProperty(year)], -1], ...tokens.heat.ndvi.flat()]
}

// The fill colours are set per year at runtime (see useHeatMapLayers), so they're absent here.
export const HEAT_GRID_LAYERS: LayerSpecification[] = [
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

export const HEAT_NDVI_LAYERS: LayerSpecification[] = [
  { id: HEAT_NDVI_FILL_LAYER_ID, type: "fill", source: HEAT_NDVI_SOURCE_ID, paint: { "fill-opacity": 0.75 } },
]

export const HEAT_BOUNDARY_LAYERS: LayerSpecification[] = [
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
        "school",
        tokens.heat.building.school,
        "kindergarten",
        tokens.heat.building.kindergarten,
        "care_facility",
        tokens.heat.building.careFacility,
        tokens.heat.building.other,
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": tokens.heat.building.stroke,
    },
  },
]

export const STUDY_OVERLAY_LAYERS: LayerSpecification[] = [
  { id: STUDY_OVERLAY_LAYER_ID, type: "raster", source: STUDY_OVERLAY_SOURCE_ID, paint: { "raster-opacity": 0.8 } },
]
