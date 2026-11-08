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

export interface HeatStoryViewModel {
  /** The summers covered; null when there are none. */
  years: { first: number; last: number; count: number } | null
  /** The latest summer's hottest non-industrial spot. `spot` is null without a reading. */
  hottestSpot: { year: number; spot: HeatYearStats["hottestNonIndustrial"] } | null
  sensitiveBuildings: {
    /** Distinct buildings in the hottest 10% in at least one summer, named or not. */
    everInHottest: number
    total: number
    /** The named ones most often in the hottest 10%, most summers first. */
    shown: { osmId: string; name: string; summers: number }[]
    /** everInHottest minus shown, so "N shown, +M more" always adds up to the total. */
    remaining: number
  }
  study: StudyComparison | null
}

const SHOWN_BUILDINGS = 2

/** Everything the heat story panel shows, computed from the commune's heat data. */
export function buildHeatStory(data: HeatMapData): HeatStoryViewModel {
  const first = data.years.at(0)
  const last = data.years.at(-1)
  const latestStats = last === undefined ? null : statsForYear(data, last)

  // Keyed by OSM id, not name: two unnamed facilities must not merge into one.
  const summersInHottest = new Map<string, { name: string | null; summers: number }>()
  for (const yearStats of data.stats) {
    for (const b of yearStats.sensitiveBuildingsInHottest10pct) {
      const entry = summersInHottest.get(b.osmId) ?? { name: b.name, summers: 0 }
      summersInHottest.set(b.osmId, { ...entry, summers: entry.summers + 1 })
    }
  }

  const shown = [...summersInHottest.entries()]
    .flatMap(([osmId, b]) => (b.name === null ? [] : [{ osmId, name: b.name, summers: b.summers }]))
    .sort((a, b) => b.summers - a.summers)
    .slice(0, SHOWN_BUILDINGS)

  return {
    years: first === undefined || last === undefined ? null : { first, last, count: data.years.length },
    hottestSpot: last === undefined ? null : { year: last, spot: latestStats?.hottestNonIndustrial ?? null },
    sensitiveBuildings: {
      everInHottest: summersInHottest.size,
      total: data.buildings.length,
      shown,
      remaining: summersInHottest.size - shown.length,
    },
    study: data.studyComparison,
  }
}

/** A commune's own heat study, shown as an optional raster overlay from a public WMS. */
export interface StudyOverlay {
  /** Toggle label and hint in the heat card. */
  label: string
  hint: string
  /** Credit line shown under the toggles. */
  attribution: string
  /** A WMS 1.3.0 GetMap endpoint that serves EPSG:3857 PNG tiles with CORS. */
  wmsUrl: string
  wmsLayer: string
}
