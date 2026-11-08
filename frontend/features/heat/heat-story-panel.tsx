"use client"

import type mapboxgl from "mapbox-gl"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { buildHeatStory, type HeatMapData } from "@/domain/heat"
import { NO2_LIMITS } from "@/domain/limits"
import { getReductionNeeded, type No2TubeDataset } from "@/domain/no2-tubes"
import { HeatHotspotList } from "./heat-hotspot-list"

interface HeatStoryPanelProps {
  data: HeatMapData
  communeName: string
  tubeDataset?: No2TubeDataset | null
  map: mapboxgl.Map | null
}

export function HeatStoryPanel({ data, communeName, tubeDataset, map }: HeatStoryPanelProps) {
  const story = buildHeatStory(data)
  const { study, years, hottestSpot, sensitiveBuildings } = story
  const yearRange = years ? `${years.first}–${years.last}` : ""
  const spot = hottestSpot?.spot ?? null

  const kennedyStudyPoint = study?.points.find((p) => p.name.toLowerCase().includes("kennedy"))
  const kennedyReduction = tubeDataset
    ? getReductionNeeded(tubeDataset, NO2_LIMITS).find((r) => r.tubeId === "kennedy")
    : undefined

  function flyToHottestSpot() {
    if (map && spot?.lngLat) map.flyTo({ center: [spot.lngLat[0], spot.lngLat[1]], zoom: 16 })
  }

  return (
    <Card className="pointer-events-auto w-[28rem] shadow-lg">
      <CardHeader className="pb-2 space-y-1">
        <h3 className="font-semibold text-sm">
          {study?.cleanSeparation
            ? "Satellite data backs the PRO-SUD heat study"
            : `Summer surface temperature in ${communeName}, observed by satellite since ${years?.first ?? ""}`}
        </h3>
        <p className="text-xs text-muted-foreground">
          {study?.cleanSeparation ? (
            <>
              In 2024, the PRO-SUD communes, LIST and GEO-NET mapped summer heat across Esch and 10 neighbouring
              communes (<em>Bioklima-Analyse für die PRO-SUD Region</em>). The study named specific hot and cool
              spots in Esch. Below is what satellites measured at those spots over {years?.count ?? 0} summers.{" "}
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
            `Checked against ${yearRange} satellite data — at least one named place didn't rank where the PRO-SUD study's naming would suggest.`
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
            yearRange={yearRange}
            map={map}
          />
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={flyToHottestSpot}
            disabled={!spot?.lngLat}
            className="rounded-md bg-muted px-2.5 py-2 text-left hover:bg-muted/70 disabled:hover:bg-muted"
          >
            <div className="font-semibold text-base">
              {spot ? `+${spot.anomalyC.toFixed(1)}°C` : "—"}
            </div>
            <div className="text-muted-foreground">
              Hottest public/residential spot, {hottestSpot?.year}
              {spot?.place ? ` — ${spot.place}` : ""}
            </div>
          </button>
          <div className="rounded-md bg-muted px-2.5 py-2">
            <div className="font-semibold text-base">
              {sensitiveBuildings.everInHottest} of {sensitiveBuildings.total}
            </div>
            <div className="text-muted-foreground">
              Schools &amp; care sites in the hottest 10%
              {sensitiveBuildings.shown.length > 0 && (
                <>
                  {" — "}
                  {sensitiveBuildings.shown.map((b) => `${b.name} (${b.summers} of ${years?.count ?? 0} summers)`).join(", ")}
                  {sensitiveBuildings.remaining > 0 ? `, +${sensitiveBuildings.remaining} more` : ""}
                </>
              )}
            </div>
          </div>
        </div>

        {kennedyStudyPoint && kennedyReduction?.status === "ok" && (
          <p className="text-xs text-ink-strong pt-3 border-t">
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
