"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { buildHeatStory, type HeatMapData, type HeatStoryViewModel, type HeatStudyContent } from "@/domain/heat"
import type { LngLat } from "@/domain/shared/geo"
import { HeatHotspotList } from "./heat-hotspot-list"

interface HeatStoryPanelProps {
  data: HeatMapData
  communeName: string
  /** The commune's own heat study, if it has one. */
  study: HeatStudyContent | null
  onFlyTo: (lngLat: LngLat) => void
  /** Optional extra note shown above the method notes (e.g. a cross-dataset callout). */
  callout?: ReactNode
}

function StudyIntro({ study, summers, yearRange }: { study: HeatStoryViewModel["study"]; summers: number; yearRange: string }) {
  if (!study) return null
  const { content } = study
  switch (study.status) {
    case "agrees":
      return (
        <p className="text-xs text-muted-foreground">
          {content.introBefore}
          <em>{content.reportTitle}</em>
          {content.introAfter.replace("{summers}", String(summers))}{" "}
          <a href={content.reportUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            {content.reportLinkLabel}
          </a>
        </p>
      )
    case "disagrees":
      return <p className="text-xs text-muted-foreground">{content.disagreesText.replace("{years}", yearRange)}</p>
    case "not-compared":
      return <p className="text-xs text-muted-foreground">{content.notComparedText}</p>
  }
}

export function HeatStoryPanel({ data, communeName, study: studyContent, onFlyTo, callout }: HeatStoryPanelProps) {
  const { study, years, hottestSpot, sensitiveBuildings } = buildHeatStory(data, studyContent)
  const yearRange = years ? `${years.first}–${years.last}` : ""
  const spot = hottestSpot?.spot ?? null
  const comparison = study && study.status !== "not-compared" ? study.comparison : null

  return (
    <Card className="pointer-events-auto w-[28rem] shadow-lg">
      <CardHeader className="pb-2 space-y-1">
        <h3 className="font-semibold text-sm">
          {study?.status === "agrees"
            ? study.content.agreesTitle
            : `Summer surface temperature in ${communeName}, observed by satellite since ${years?.first ?? ""}`}
        </h3>
        <StudyIntro study={study} summers={years?.count ?? 0} yearRange={yearRange} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {comparison && (
          <HeatHotspotList
            points={comparison.points}
            coldestHotPointC={comparison.coldestHotPointC}
            warmestCoolPointC={comparison.warmestCoolPointC}
            cleanSeparation={comparison.cleanSeparation}
            yearRange={yearRange}
            onFlyTo={onFlyTo}
          />
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => spot?.lngLat && onFlyTo(spot.lngLat)}
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

        {callout}

        <div className="text-xs text-muted-foreground pt-2 border-t flex flex-col gap-1">
          <p>Industrial land excluded above: active-plant process heat isn&apos;t something commune planning can change.</p>
          <p>
            Satellite: surface temperature, ~11:00, 100m, June–August median.
            {studyContent && ` ${studyContent.methodNote}`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
