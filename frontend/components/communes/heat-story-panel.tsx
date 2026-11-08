"use client"

import type mapboxgl from "mapbox-gl"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { HeatMapData } from "@/lib/heat-map"
import { getHeatYears } from "@/lib/heat-map"
import type { NO2TubeDataset } from "@/lib/no2-tubes"
import { getReductionNeeded } from "@/lib/no2-tubes"
import { HeatHotspotList } from "./heat-hotspot-list"

interface HeatStoryPanelProps {
  data: HeatMapData
  communeName: string
  tubeDataset?: NO2TubeDataset | null
  map: mapboxgl.Map | null
}

export function HeatStoryPanel({ data, communeName, tubeDataset, map }: HeatStoryPanelProps) {
  const years = getHeatYears(data.stats)
  const latestYear = years[years.length - 1]
  const latestYearStats = data.stats.years[String(latestYear)]
  const study = data.studyComparison

  // Per-building count of how many of the {years.length} summers it landed in the
  // (non-industrial) hottest 10% - keyed by osm_id, not name, since two unnamed
  // facilities would otherwise collide under the same "(unnamed)" label.
  const buildingYearCounts = new Map<string, { name: string; count: number }>()
  for (const y of years) {
    for (const b of data.stats.years[String(y)].sensitive_buildings_in_hottest_10pct) {
      const existing = buildingYearCounts.get(b.osm_id)
      if (existing) existing.count += 1
      else buildingYearCounts.set(b.osm_id, { name: b.name, count: 1 })
    }
  }
  const namedBuildings = [...buildingYearCounts.values()]
    .filter((b) => b.name !== "(unnamed)")
    .sort((a, b) => b.count - a.count)
  const totalEverHottest = buildingYearCounts.size
  const namedShown = namedBuildings.slice(0, 2)
  // Bug caught by review: this must subtract from totalEverHottest (which includes
  // unnamed facilities), not namedBuildings.length, or "2 shown + N more" stops adding
  // up to the badge's own total.
  const namedRemaining = totalEverHottest - namedShown.length

  const kennedyStudyPoint = study?.points.find((p) => p.name.toLowerCase().includes("kennedy"))
  const kennedyReduction = tubeDataset
    ? getReductionNeeded(tubeDataset).find((r) => r.tubeId === "kennedy")
    : undefined

  function flyToHottestSpot() {
    if (map && latestYearStats?.hottest_non_industrial_lat != null && latestYearStats?.hottest_non_industrial_lon != null) {
      map.flyTo({ center: [latestYearStats.hottest_non_industrial_lon, latestYearStats.hottest_non_industrial_lat], zoom: 16 })
    }
  }

  return (
    <Card className="pointer-events-auto w-[28rem] shadow-lg">
      <CardHeader className="pb-2 space-y-1">
        <h3 className="font-semibold text-sm">
          {study?.cleanSeparation
            ? "Satellite data backs the PRO-SUD heat study"
            : `Summer surface temperature in ${communeName}, observed by satellite since ${years[0]}`}
        </h3>
        <p className="text-xs text-muted-foreground">
          {study?.cleanSeparation ? (
            <>
              In 2024, the PRO-SUD communes, LIST and GEO-NET mapped summer heat across Esch and 10 neighbouring
              communes (<em>Bioklima-Analyse für die PRO-SUD Region</em>). The study named specific hot and cool
              spots in Esch. Below is what satellites measured at those spots over {years.length} summers.{" "}
              <a
                href="https://minett-biosphere.com/wp-content/uploads/2024/10/Bioklima-Analyse-Region-PRO-SUD.pdf"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                Read the study (PDF) ↗
              </a>
            </>
          ) : study ? (
            `Checked against ${years[0]}–${years[years.length - 1]} satellite data — at least one named place didn't rank where the PRO-SUD study's naming would suggest.`
          ) : (
            "No comparison against the PRO-SUD study prepared for this commune yet."
          )}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {study && (
          <HeatHotspotList
            points={study.points}
            coldestHotPointC={study.coldestHotPointC}
            warmestCoolPointC={study.warmestCoolPointC}
            cleanSeparation={study.cleanSeparation}
            yearRange={`${years[0]}–${years[years.length - 1]}`}
            map={map}
          />
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={flyToHottestSpot}
            disabled={!latestYearStats?.hottest_non_industrial_lat}
            className="rounded-md bg-muted px-2.5 py-2 text-left hover:bg-muted/70 disabled:hover:bg-muted"
          >
            <div className="font-semibold text-base">
              {latestYearStats?.hottest_non_industrial_anomaly_c != null
                ? `+${latestYearStats.hottest_non_industrial_anomaly_c.toFixed(1)}°C`
                : "—"}
            </div>
            <div className="text-muted-foreground">
              Hottest public/residential spot, {latestYear}
              {latestYearStats?.hottest_non_industrial_place ? ` — ${latestYearStats.hottest_non_industrial_place}` : ""}
            </div>
          </button>
          <div className="rounded-md bg-muted px-2.5 py-2">
            <div className="font-semibold text-base">
              {totalEverHottest} of {data.buildings.features.length}
            </div>
            <div className="text-muted-foreground">
              Schools &amp; care sites in the hottest 10%
              {namedShown.length > 0 && (
                <>
                  {" — "}
                  {namedShown.map((b) => `${b.name} (${b.count} of ${years.length} summers)`).join(", ")}
                  {namedRemaining > 0 ? `, +${namedRemaining} more` : ""}
                </>
              )}
            </div>
          </div>
        </div>

        {kennedyStudyPoint && kennedyReduction && (
          <p className="text-xs text-neutral-700 pt-3 border-t">
            <span className="font-medium">Boulevard Kennedy:</span> a heat hotspot in the PRO-SUD study, and NO₂
            still{" "}
            <span className="font-semibold">
              {kennedyReduction.pctVsTarget > 0 ? "+" : ""}
              {kennedyReduction.pctVsTarget.toFixed(0)}%
            </span>{" "}
            above the 2030 value.
          </p>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t flex flex-col gap-1">
          <p>Industrial land excluded above: active-plant process heat isn&apos;t something commune planning can change.</p>
          <p>
            Satellite: surface temperature, ~11:00, 100m, June–August median. PRO-SUD study: modelled air
            temperature and felt heat on one simulated day. Never blended.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
