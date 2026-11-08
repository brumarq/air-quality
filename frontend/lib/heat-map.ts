// Loader + map styling for Step 3's heat-map data, built by scripts/build_esch_heat_grid.py
// (see ESCH-HEAT-PROFILE-PLAN.md Step 3, Week 1). Fetched at runtime rather than
// statically imported like the NO2 tube data (api/no2-tubes.ts) - the grid alone is
// ~800KB, too large to bundle into every page load when only heat mode needs it.

import type mapboxgl from "mapbox-gl"
import { HEAT_LEGEND_STOPS, type HeatMapData } from "@/domain/heat"

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
    // no-store: this data only changes via a pipeline rerun, but a stale cached copy
    // after one (e.g. post-rerun, pre-reload) is exactly the kind of mismatch a
    // reviewer catches and loses trust in the whole page over - not worth the risk.
    try {
      const [grid, boundary, buildings, stats] = await Promise.all([
        fetch(`${base}/heat-grid.geojson`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/boundary.geojson`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/sensitive-buildings.geojson`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`${base}/stats.json`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      ])
      // Optional - only the Week 0 check script writes this one, not every commune will have it.
      const studyComparison = await fetch(`${base}/study-comparison.json`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
      return { grid, boundary, buildings, stats, studyComparison }
    } catch {
      return null
    }
  })()

  cache.set(communeSlug, promise)
  return promise
}

/** A Mapbox GL `interpolate` expression over a fixed year's anomaly property. */
export function anomalyFillExpression(year: number): mapboxgl.Expression {
  const stops = HEAT_LEGEND_STOPS.flatMap(([stop, color]) => [stop, color])
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", `anomaly_c_${year}`], -99],
    ...stops,
  ] as unknown as mapboxgl.Expression
}
