import type { LngLat } from "@/shared/domain/geo"

export const BUILDING_KINDS = ["school", "kindergarten", "care_facility"] as const
export type BuildingKind = (typeof BUILDING_KINDS)[number]

export const BUILDING_KIND_LABEL: Record<BuildingKind, string> = {
  school: "School",
  kindergarten: "Kindergarten / crèche",
  care_facility: "Care facility",
}

export const buildingName = (name: string | null) => name ?? "(unnamed)"

export interface HeatCellYear {
  year: number
  tempC: number | null
  anomalyC: number | null
  ndvi: number | null
}

export interface HeatCell {
  id: string
  years: HeatCellYear[]
}

export interface SensitiveBuilding {
  osmId: string
  name: string | null
  kind: BuildingKind
  nearestCellId: string
}

export interface HeatYearStats {
  year: number
  communeMeanC: number
  hottest10pctCellCount: number
  hottestCellIds: string[]
  sensitiveBuildingsInHottest10pct: { osmId: string; name: string | null; kind: BuildingKind }[]
  hottestNonIndustrial: { anomalyC: number; place: string | null; lngLat: LngLat | null } | null
}

export interface StudyComparisonPoint {
  name: string
  studySays: "hot" | "cool"
  tempC: number
  approximate: boolean
  lngLat: LngLat
}

export interface StudyComparison {
  method: string
  points: StudyComparisonPoint[]
  coldestHotPointC: number
  warmestCoolPointC: number
  cleanSeparation: boolean
}

export interface HeatMapData {
  years: number[]
  cells: HeatCell[]
  gridGeoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon>
  boundary: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  buildings: SensitiveBuilding[]
  buildingsGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point>
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

export interface StudyOverlay {
  label: string
  hint: string
  attribution: string
  wmsUrl: string
  wmsLayer: string
}

export type HeatSelection = { type: "cell"; id: string } | { type: "building"; id: string }

export interface HeatLayerToggles {
  grid: boolean
  ndvi: boolean
  buildings: boolean
  studyOverlay: boolean
}

export const DEFAULT_HEAT_LAYER_TOGGLES: HeatLayerToggles = { grid: true, ndvi: false, buildings: true, studyOverlay: false }

export interface HeatStudyContent {
  agreesTitle: string
  introBefore: string
  reportTitle: string
  introAfter: (summers: number) => string
  reportUrl: string
  reportLinkLabel: string
  disagreesText: (yearRange: string) => string
  notComparedText: string
  methodNote: string
}
