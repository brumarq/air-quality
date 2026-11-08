// Loads a commune's heat-map files from public/data/<slug>/, written by the heat pipeline in
// scripts/ (build_esch_heat_grid.py and the study-comparison check). They're fetched at
// runtime rather than bundled: the grid alone is ~800KB and only heat mode needs it.
//
// The pipeline writes snake_case fields, year-keyed records and per-year grid properties
// named `anomaly_c_<year>`. Everything is validated and converted here, so domain code
// only sees camelCase fields, numeric years and per-year arrays.

import { z } from "zod"
import { loadStaticJson, type LoadResult } from "@/api/static-data"
import type { HeatCell, HeatMapData, HeatYearStats, SensitiveBuilding, StudyComparison } from "@/domain/heat"

const YearKey = z.string().regex(/^\d{4}$/, "expected a four-digit year")
const BuildingKindSchema = z.enum(["school", "kindergarten", "care_facility"])
const Position = z.tuple([z.number(), z.number()]).rest(z.number())
const PolygonSchema = z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(Position)) })
const MultiPolygonSchema = z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(z.array(Position))) })

// OpenStreetMap features without a name come through as this placeholder.
const UNNAMED = "(unnamed)"
const OsmName = z.string().transform((name) => (name === UNNAMED ? null : name))

const optionalNumber = z.number().nullable().optional().transform((v) => v ?? null)

// Grid cell properties are flat: id, is_industrial, and temp_c_<year> / anomaly_c_<year> /
// ndvi_<year> for every summer. Per-year keys are read once into the cell's `years` list.
const GridCellPropertiesSchema = z.object({ id: z.string(), is_industrial: z.boolean() }).catchall(z.unknown())
const GridSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(z.object({ type: z.literal("Feature"), properties: GridCellPropertiesSchema, geometry: PolygonSchema })),
})

const BoundarySchema = z.object({
  type: z.literal("Feature"),
  properties: z.record(z.unknown()).nullable(),
  geometry: z.union([PolygonSchema, MultiPolygonSchema]),
})

const BuildingsSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      properties: z.object({ osm_id: z.string(), name: OsmName, kind: BuildingKindSchema, nearest_cell_id: z.string() }),
      geometry: z.object({ type: z.literal("Point"), coordinates: Position }),
    }),
  ),
})

const StatsYearSchema = z.object({
  commune_mean_c: z.number(),
  hottest_10pct_threshold_anomaly_c: z.number().nullable(),
  hottest_10pct_cell_count: z.number().int(),
  hottest_cell_ids: z.array(z.string()),
  sensitive_buildings_in_hottest_10pct: z.array(z.object({ name: OsmName, kind: BuildingKindSchema, osm_id: z.string() })),
  industrial_max_anomaly_c: z.number().nullable(),
  industrial_cell_count: z.number().int(),
  hottest_non_industrial_anomaly_c: z.number().nullable(),
  hottest_non_industrial_place: z.string().nullable(),
  hottest_non_industrial_lat: z.number().nullable(),
  hottest_non_industrial_lon: z.number().nullable(),
})

const StatsSchema = z.object({ years: z.record(YearKey, StatsYearSchema) })

const StudyComparisonSchema: z.ZodType<StudyComparison, z.ZodTypeDef, unknown> = z
  .object({
    method: z.string(),
    points: z.array(
      z.object({
        name: z.string(),
        studySays: z.enum(["hot", "cool"]),
        tempC: z.number(),
        approximate: z.boolean(),
        lat: z.number(),
        lon: z.number(),
      }),
    ),
    coldestHotPointC: z.number(),
    warmestCoolPointC: z.number(),
    cleanSeparation: z.boolean(),
  })
  .transform(({ points, ...rest }) => ({
    ...rest,
    points: points.map(({ lat, lon, ...point }) => ({ ...point, lngLat: [lon, lat] as const })),
  }))

type GridFile = z.infer<typeof GridSchema>
type StatsFile = z.infer<typeof StatsSchema>
type BuildingsFile = z.infer<typeof BuildingsSchema>

function toYearStats([yearKey, s]: [string, z.infer<typeof StatsYearSchema>]): HeatYearStats {
  const lngLat = s.hottest_non_industrial_lon !== null && s.hottest_non_industrial_lat !== null
    ? ([s.hottest_non_industrial_lon, s.hottest_non_industrial_lat] as const)
    : null
  return {
    year: Number(yearKey),
    communeMeanC: s.commune_mean_c,
    hottest10pctThresholdAnomalyC: s.hottest_10pct_threshold_anomaly_c,
    hottest10pctCellCount: s.hottest_10pct_cell_count,
    hottestCellIds: s.hottest_cell_ids,
    sensitiveBuildingsInHottest10pct: s.sensitive_buildings_in_hottest_10pct.map((b) => ({ osmId: b.osm_id, name: b.name, kind: b.kind })),
    industrialMaxAnomalyC: s.industrial_max_anomaly_c,
    industrialCellCount: s.industrial_cell_count,
    hottestNonIndustrial:
      s.hottest_non_industrial_anomaly_c === null
        ? null
        : { anomalyC: s.hottest_non_industrial_anomaly_c, place: s.hottest_non_industrial_place, lngLat },
  }
}

const cellValue = (properties: Record<string, unknown>, key: string) => optionalNumber.parse(properties[key])

function toCells(grid: GridFile, years: number[]): HeatCell[] {
  return grid.features.map(({ properties, geometry }) => ({
    id: properties.id,
    isIndustrial: properties.is_industrial,
    polygon: geometry,
    years: years.map((year) => ({
      year,
      tempC: cellValue(properties, `temp_c_${year}`),
      anomalyC: cellValue(properties, `anomaly_c_${year}`),
      ndvi: cellValue(properties, `ndvi_${year}`),
    })),
  }))
}

function toBuildings(file: BuildingsFile): SensitiveBuilding[] {
  return file.features.map(({ properties: p, geometry }) => ({
    osmId: p.osm_id,
    name: p.name,
    kind: p.kind,
    nearestCellId: p.nearest_cell_id,
    lngLat: [geometry.coordinates[0], geometry.coordinates[1]] as const,
  }))
}

function toHeatMapData(
  grid: GridFile,
  boundary: z.infer<typeof BoundarySchema>,
  buildings: BuildingsFile,
  statsFile: StatsFile,
  studyComparison: StudyComparison | null,
): HeatMapData {
  const stats = Object.entries(statsFile.years).map(toYearStats).sort((a, b) => a.year - b.year)
  const years = stats.map((s) => s.year)
  return {
    years,
    cells: toCells(grid, years),
    boundary: { type: "Feature", properties: boundary.properties, geometry: boundary.geometry },
    buildings: toBuildings(buildings),
    stats,
    studyComparison,
  }
}

// Only successful loads are cached (the grid is large and doesn't change during a visit).
// A failure is never cached, so the next attempt tries again.
const cache = new Map<string, LoadResult<HeatMapData>>()

/**
 * A commune's heat-map data. "not-prepared" means the pipeline hasn't been run for the
 * commune (the grid file is missing); a missing companion file once the grid exists is an
 * error, since the pipeline writes them together. The study comparison is optional.
 */
export async function fetchHeatMapData(communeSlug: string, signal?: AbortSignal): Promise<LoadResult<HeatMapData>> {
  const cached = cache.get(communeSlug)
  if (cached) return cached

  const base = `/data/${communeSlug}`
  const [grid, boundary, buildings, stats, study] = await Promise.all([
    loadStaticJson(`${base}/heat-grid.geojson`, GridSchema, signal),
    loadStaticJson(`${base}/boundary.geojson`, BoundarySchema, signal),
    loadStaticJson(`${base}/sensitive-buildings.geojson`, BuildingsSchema, signal),
    loadStaticJson(`${base}/stats.json`, StatsSchema, signal),
    loadStaticJson(`${base}/study-comparison.json`, StudyComparisonSchema, signal),
  ])

  const result = combine(grid, boundary, buildings, stats, study)
  if (result.status !== "error") cache.set(communeSlug, result)
  return result
}

function combine(
  grid: LoadResult<GridFile>,
  boundary: LoadResult<z.infer<typeof BoundarySchema>>,
  buildings: LoadResult<BuildingsFile>,
  stats: LoadResult<StatsFile>,
  study: LoadResult<StudyComparison>,
): LoadResult<HeatMapData> {
  if (grid.status === "not-prepared") return grid
  for (const part of [grid, boundary, buildings, stats, study]) {
    if (part.status === "error") return part
  }
  if (grid.status !== "ok" || boundary.status !== "ok" || buildings.status !== "ok" || stats.status !== "ok") {
    return { status: "error", error: new Error("The heat grid exists but its boundary, buildings or stats file is missing") }
  }
  return {
    status: "ok",
    data: toHeatMapData(grid.data, boundary.data, buildings.data, stats.data, study.status === "ok" ? study.data : null),
  }
}
