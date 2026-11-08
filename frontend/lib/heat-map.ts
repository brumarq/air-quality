// Types + loader for Step 3's heat-map data, built by scripts/build_esch_heat_grid.py
// (see ESCH-HEAT-PROFILE-PLAN.md Step 3, Week 1). Fetched at runtime rather than
// statically imported like the NO2 tube data (lib/no2-tubes.ts) - the grid alone is
// ~800KB, too large to bundle into every page load when only heat mode needs it.

import type mapboxgl from "mapbox-gl"

export interface HeatGridCellProperties {
  id: string
  [key: `temp_c_${number}`]: number | null
  [key: `anomaly_c_${number}`]: number | null
  [key: `ndvi_${number}`]: number | null
}

export interface HeatStatsYear {
  commune_mean_c: number
  hottest_10pct_threshold_anomaly_c: number | null
  hottest_10pct_cell_count: number
  hottest_cell_ids: string[]
  sensitive_buildings_in_hottest_10pct: { name: string; kind: string; osm_id: string }[]
}

export interface HeatStats {
  generatedAt: string
  gridCellSizeMeters: number
  gridCellCount: number
  years: Record<string, HeatStatsYear>
}

export interface SensitiveBuildingProperties {
  osm_id: string
  name: string
  kind: "school" | "kindergarten" | "nursing_home"
  nearest_cell_id: string
}

export interface HeatMapData {
  grid: GeoJSON.FeatureCollection<GeoJSON.Polygon, HeatGridCellProperties>
  boundary: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  buildings: GeoJSON.FeatureCollection<GeoJSON.Point, SensitiveBuildingProperties>
  stats: HeatStats
}

const cache = new Map<string, Promise<HeatMapData | null>>()

/**
 * Only communes with a scripts/build_*_heat_grid.py run have data (Esch today) - returns
 * null rather than throwing, same "no data for this commune yet" contract as
 * getNo2TubeDataset.
 */
export function fetchHeatMapData(communeSlug: string): Promise<HeatMapData | null> {
  const cached = cache.get(communeSlug)
  if (cached) return cached

  const promise = (async (): Promise<HeatMapData | null> => {
    const base = `/data/${communeSlug}`
    try {
      const [grid, boundary, buildings, stats] = await Promise.all([
        fetch(`${base}/heat-grid.geojson`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/boundary.geojson`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/sensitive-buildings.geojson`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/stats.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      ])
      return { grid, boundary, buildings, stats }
    } catch {
      return null
    }
  })()

  cache.set(communeSlug, promise)
  return promise
}

export function getHeatYears(stats: HeatStats): number[] {
  return Object.keys(stats.years).map(Number).sort((a, b) => a - b)
}

const DIVERGING_RAMP: [number, string][] = [
  [-10, "#2166AC"],
  [-5, "#67A9CF"],
  [0, "#F7F7F7"],
  [5, "#FDDBC7"],
  [8, "#EF8A62"],
  [12, "#B2182B"],
]

/** A Mapbox GL `interpolate` expression over a fixed year's anomaly property. */
export function anomalyFillExpression(year: number): mapboxgl.Expression {
  const stops = DIVERGING_RAMP.flatMap(([stop, color]) => [stop, color])
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", `anomaly_c_${year}`], -99],
    ...stops,
  ] as unknown as mapboxgl.Expression
}

export const HEAT_LEGEND_STOPS = DIVERGING_RAMP

export const BUILDING_KIND_LABEL: Record<SensitiveBuildingProperties["kind"], string> = {
  school: "School",
  kindergarten: "Kindergarten / crèche",
  nursing_home: "Care home",
}
