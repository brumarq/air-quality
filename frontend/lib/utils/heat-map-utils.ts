import type mapboxgl from "mapbox-gl"
import type { HeatMapData } from "@/lib/heat-map"
import { anomalyFillExpression } from "@/lib/heat-map"

export const HEAT_GRID_SOURCE_ID = "heat-grid-data"
export const HEAT_GRID_FILL_LAYER_ID = "heat-grid-fill"
export const HEAT_GRID_OUTLINE_LAYER_ID = "heat-grid-outline"
export const HEAT_BOUNDARY_SOURCE_ID = "heat-boundary-data"
export const HEAT_BOUNDARY_LAYER_ID = "heat-boundary-outline"
export const HEAT_BUILDINGS_SOURCE_ID = "heat-buildings-data"
export const HEAT_BUILDINGS_LAYER_ID = "heat-buildings-markers"
export const HEAT_NDVI_SOURCE_ID = "heat-ndvi-data"
export const HEAT_NDVI_FILL_LAYER_ID = "heat-ndvi-fill"
export const PROSUD_WMS_SOURCE_ID = "prosud-wms-data"
export const PROSUD_WMS_LAYER_ID = "prosud-wms-layer"

// wms.geoportail.lu/public_map_layers/service, layers 2922 (day)/2923 (night) - confirmed
// public, CORS-open, EPSG:3857-capable, and rendering correctly inside Mapbox GL via the
// {bbox-epsg-3857} template (see ESCH-HEAT-PROFILE-PLAN.md Step 3, Week 0).
function wmsTileUrl(layerId: number) {
  return `https://wms.geoportail.lu/public_map_layers/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layerId}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true`
}

export function addHeatGridLayer(map: mapboxgl.Map, data: HeatMapData, year: number) {
  if (!map.getSource(HEAT_GRID_SOURCE_ID)) {
    // promoteId lets feature-state (the hover outline below) key off our own cell id,
    // which lives in properties.id - GeoJSON features have no top-level id otherwise.
    map.addSource(HEAT_GRID_SOURCE_ID, { type: "geojson", data: data.grid, promoteId: "id" })
  }

  if (!map.getLayer(HEAT_GRID_FILL_LAYER_ID)) {
    map.addLayer({
      id: HEAT_GRID_FILL_LAYER_ID,
      type: "fill",
      source: HEAT_GRID_SOURCE_ID,
      paint: {
        "fill-color": anomalyFillExpression(year),
        "fill-opacity": 0.75,
      },
    })
  }

  if (!map.getLayer(HEAT_GRID_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: HEAT_GRID_OUTLINE_LAYER_ID,
      type: "line",
      source: HEAT_GRID_SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.2],
        "line-opacity": 0.5,
      },
    })
  }
}

export function setHeatGridYear(map: mapboxgl.Map, year: number) {
  if (map.getLayer(HEAT_GRID_FILL_LAYER_ID)) {
    map.setPaintProperty(HEAT_GRID_FILL_LAYER_ID, "fill-color", anomalyFillExpression(year))
  }
}

export function removeHeatGridLayer(map: mapboxgl.Map) {
  if (map.getLayer(HEAT_GRID_OUTLINE_LAYER_ID)) map.removeLayer(HEAT_GRID_OUTLINE_LAYER_ID)
  if (map.getLayer(HEAT_GRID_FILL_LAYER_ID)) map.removeLayer(HEAT_GRID_FILL_LAYER_ID)
  if (map.getSource(HEAT_GRID_SOURCE_ID)) map.removeSource(HEAT_GRID_SOURCE_ID)
}

export function addHeatBoundaryLayer(map: mapboxgl.Map, data: HeatMapData) {
  if (!map.getSource(HEAT_BOUNDARY_SOURCE_ID)) {
    map.addSource(HEAT_BOUNDARY_SOURCE_ID, { type: "geojson", data: data.boundary })
  }
  if (!map.getLayer(HEAT_BOUNDARY_LAYER_ID)) {
    map.addLayer({
      id: HEAT_BOUNDARY_LAYER_ID,
      type: "line",
      source: HEAT_BOUNDARY_SOURCE_ID,
      paint: { "line-color": "#1f2937", "line-width": 2, "line-dasharray": [2, 1] },
    })
  }
}

export function removeHeatBoundaryLayer(map: mapboxgl.Map) {
  if (map.getLayer(HEAT_BOUNDARY_LAYER_ID)) map.removeLayer(HEAT_BOUNDARY_LAYER_ID)
  if (map.getSource(HEAT_BOUNDARY_SOURCE_ID)) map.removeSource(HEAT_BOUNDARY_SOURCE_ID)
}

const BUILDING_KIND_COLOR: Record<string, string> = {
  school: "#7C3AED",
  kindergarten: "#DB2777",
  nursing_home: "#0D9488",
}

export function addHeatBuildingsLayer(map: mapboxgl.Map, data: HeatMapData) {
  if (!map.getSource(HEAT_BUILDINGS_SOURCE_ID)) {
    map.addSource(HEAT_BUILDINGS_SOURCE_ID, { type: "geojson", data: data.buildings })
  }
  if (!map.getLayer(HEAT_BUILDINGS_LAYER_ID)) {
    map.addLayer({
      id: HEAT_BUILDINGS_LAYER_ID,
      type: "circle",
      source: HEAT_BUILDINGS_SOURCE_ID,
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "kind"],
          "school", BUILDING_KIND_COLOR.school,
          "kindergarten", BUILDING_KIND_COLOR.kindergarten,
          "nursing_home", BUILDING_KIND_COLOR.nursing_home,
          "#6B7280",
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    })
  }
}

export function removeHeatBuildingsLayer(map: mapboxgl.Map) {
  if (map.getLayer(HEAT_BUILDINGS_LAYER_ID)) map.removeLayer(HEAT_BUILDINGS_LAYER_ID)
  if (map.getSource(HEAT_BUILDINGS_SOURCE_ID)) map.removeSource(HEAT_BUILDINGS_SOURCE_ID)
}

// NDVI (vegetation greenness) is a genuinely finer-resolution variable than the thermal
// grid (Sentinel-2's native 10m vs. Landsat thermal's 100m), but the pipeline currently
// only exports it pre-aggregated into the same 100m cells (see Week 1) - still useful as
// a toggle, just not yet rendered at its own native sharpness.
export function addHeatNdviLayer(map: mapboxgl.Map, data: HeatMapData, year: number) {
  if (!map.getSource(HEAT_NDVI_SOURCE_ID)) {
    map.addSource(HEAT_NDVI_SOURCE_ID, { type: "geojson", data: data.grid })
  }
  if (!map.getLayer(HEAT_NDVI_FILL_LAYER_ID)) {
    map.addLayer({
      id: HEAT_NDVI_FILL_LAYER_ID,
      type: "fill",
      source: HEAT_NDVI_SOURCE_ID,
      paint: {
        "fill-color": [
          "interpolate", ["linear"], ["coalesce", ["get", `ndvi_${year}`], -1],
          -1, "#44403C",
          0, "#FEF3C7",
          0.5, "#84CC16",
          0.9, "#166534",
        ],
        "fill-opacity": 0.75,
      },
    })
  }
}

export function setHeatNdviYear(map: mapboxgl.Map, year: number) {
  if (map.getLayer(HEAT_NDVI_FILL_LAYER_ID)) {
    map.setPaintProperty(HEAT_NDVI_FILL_LAYER_ID, "fill-color", [
      "interpolate", ["linear"], ["coalesce", ["get", `ndvi_${year}`], -1],
      -1, "#44403C",
      0, "#FEF3C7",
      0.5, "#84CC16",
      0.9, "#166534",
    ])
  }
}

export function removeHeatNdviLayer(map: mapboxgl.Map) {
  if (map.getLayer(HEAT_NDVI_FILL_LAYER_ID)) map.removeLayer(HEAT_NDVI_FILL_LAYER_ID)
  if (map.getSource(HEAT_NDVI_SOURCE_ID)) map.removeSource(HEAT_NDVI_SOURCE_ID)
}

export function addProsudWmsLayer(map: mapboxgl.Map, layerId: number = 2922) {
  if (!map.getSource(PROSUD_WMS_SOURCE_ID)) {
    map.addSource(PROSUD_WMS_SOURCE_ID, {
      type: "raster",
      tiles: [wmsTileUrl(layerId)],
      tileSize: 256,
    })
  }
  if (!map.getLayer(PROSUD_WMS_LAYER_ID)) {
    map.addLayer({
      id: PROSUD_WMS_LAYER_ID,
      type: "raster",
      source: PROSUD_WMS_SOURCE_ID,
      paint: { "raster-opacity": 0.8 },
    })
  }
}

export function removeProsudWmsLayer(map: mapboxgl.Map) {
  if (map.getLayer(PROSUD_WMS_LAYER_ID)) map.removeLayer(PROSUD_WMS_LAYER_ID)
  if (map.getSource(PROSUD_WMS_SOURCE_ID)) map.removeSource(PROSUD_WMS_SOURCE_ID)
}
