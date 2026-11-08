// Heat-map data: surface temperature per ~100m grid cell from summer Landsat scenes, the
// commune's sensitive buildings, and per-year summary statistics, all prepared by the
// heat pipeline in scripts/. api/heat.ts parses the pipeline's files into these types.

import type { LngLat } from "@/domain/shared/geo"

export type BuildingKind = "school" | "kindergarten" | "care_facility"

export const BUILDING_KIND_LABEL: Record<BuildingKind, string> = {
  school: "School",
  kindergarten: "Kindergarten / crèche",
  care_facility: "Care facility",
}

/** One summer's values for a grid cell. Any of them can be missing (e.g. clouds every pass). */
export interface HeatCellYear {
  year: number
  tempC: number | null
  /** Surface temperature minus that summer's commune-wide mean. */
  anomalyC: number | null
  ndvi: number | null
}

export interface HeatCell {
  id: string
  isIndustrial: boolean
  polygon: GeoJSON.Polygon
  /** One entry per year in HeatMapData.years, in the same order. */
  years: HeatCellYear[]
}

export interface SensitiveBuilding {
  osmId: string
  /** null when OpenStreetMap has no name for it. */
  name: string | null
  kind: BuildingKind
  nearestCellId: string
  lngLat: LngLat
}

export interface HeatYearStats {
  year: number
  communeMeanC: number
  hottest10pctThresholdAnomalyC: number | null
  hottest10pctCellCount: number
  hottestCellIds: string[]
  sensitiveBuildingsInHottest10pct: { osmId: string; name: string | null; kind: BuildingKind }[]
  // "Hottest 10%" excludes private industrial land (e.g. the active ArcelorMittal Belval
  // plant). That land reads hottest of all, but a commune officer has no lever over it,
  // and including it crowded real school hotspots out of the set. Its own worst reading
  // is kept here as a separate stat rather than hidden.
  industrialMaxAnomalyC: number | null
  industrialCellCount: number
  /** The hottest cell outside industrial land, or null if there's no reading for it. */
  hottestNonIndustrial: { anomalyC: number; place: string | null; lngLat: LngLat | null } | null
}

export interface StudyComparisonPoint {
  name: string
  studySays: "hot" | "cool"
  tempC: number
  approximate: boolean
  lngLat: LngLat
}

/** Satellite readings at the spots a commune's own heat study named hot or cool. */
export interface StudyComparison {
  method: string
  points: StudyComparisonPoint[]
  coldestHotPointC: number
  warmestCoolPointC: number
  cleanSeparation: boolean
}

export interface HeatMapData {
  /** The summers covered, oldest first. */
  years: number[]
  cells: HeatCell[]
  boundary: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  buildings: SensitiveBuilding[]
  /** One entry per year in `years`, in the same order. */
  stats: HeatYearStats[]
  studyComparison: StudyComparison | null
}

export function statsForYear(data: HeatMapData, year: number): HeatYearStats | null {
  return data.stats.find((s) => s.year === year) ?? null
}

export function cellYear(cell: HeatCell, year: number): HeatCellYear | null {
  return cell.years.find((y) => y.year === year) ?? null
}

export function latestHeatYear(data: HeatMapData): number | null {
  return data.years.at(-1) ?? null
}
