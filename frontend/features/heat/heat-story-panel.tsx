"use client"

import type { ReactNode } from "react"
import { scaleLinear } from "d3-scale"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { statsForYear, type HeatMapData, type HeatStudyContent, type StudyComparison, type StudyComparisonPoint } from "./model"
import { formatCelsius, formatCelsiusDifference } from "@/shared/lib/numbers"
import type { LngLat } from "@/shared/domain/geo"
import { tokens } from "@/shared/theme/tokens"

export type HeatStudyStatus =
  | { status: "agrees" | "disagrees"; content: HeatStudyContent; comparison: StudyComparison }
  | { status: "not-compared"; content: HeatStudyContent }

export function studyStatus(comparison: StudyComparison | null, content: HeatStudyContent | null): HeatStudyStatus | null {
  if (!content) return null
  if (!comparison) return { status: "not-compared", content }
  return { status: comparison.cleanSeparation ? "agrees" : "disagrees", content, comparison }
}

const SHOWN_BUILDINGS = 2

export interface SensitiveBuildingRanking {
  everInHottest: number
  shown: { osmId: string; name: string; summers: number }[]
  remaining: number
}

export function rankSensitiveBuildings(data: HeatMapData): SensitiveBuildingRanking {
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

  return { everInHottest: summersInHottest.size, shown, remaining: summersInHottest.size - shown.length }
}

function shownBuildingsText(buildings: SensitiveBuildingRanking, summers: number): string {
  const named = buildings.shown.map((b) => `${b.name} (${b.summers} of ${summers} summers)`).join(", ")
  return buildings.remaining > 0 ? `${named}, +${buildings.remaining} more` : named
}

export function splitHotspots(points: StudyComparisonPoint[]): { hot: StudyComparisonPoint[]; cool: StudyComparisonPoint[] } {
  const warmestFirst = points.toSorted((a, b) => b.tempC - a.tempC)
  return { hot: warmestFirst.filter((p) => p.studySays === "hot"), cool: warmestFirst.filter((p) => p.studySays === "cool") }
}

export function hotspotBarPct(points: StudyComparisonPoint[]): (tempC: number) => number {
  if (points.length === 0) return () => 0
  const temps = points.map((p) => p.tempC)
  const min = Math.floor(Math.min(...temps) - 0.5)
  const max = Math.ceil(Math.max(...temps) + 0.5)
  return scaleLinear().domain([min, max]).range([0, 100])
}

interface HeatStoryPanelProps {
  data: HeatMapData
  communeName: string
  study: HeatStudyContent | null
  onFlyTo: (lngLat: LngLat) => void
  callout?: ReactNode
  industryNote: string | null
}

function StudyIntro({ study, summers, yearRange }: { study: HeatStudyStatus | null; summers: number; yearRange: string }) {
  if (!study) return null
  const { content } = study
  switch (study.status) {
    case "agrees":
      return (
        <p className="text-xs text-muted-foreground">
          {content.introBefore}
          <em>{content.reportTitle}</em>
          {content.introAfter(summers)}{" "}
          <a href={content.reportUrl} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            {content.reportLinkLabel}
          </a>
        </p>
      )
    case "disagrees":
      return <p className="text-xs text-muted-foreground">{content.disagreesText(yearRange)}</p>
    case "not-compared":
      return <p className="text-xs text-muted-foreground">{content.notComparedText}</p>
  }
}

export function HeatStoryPanel({ data, communeName, study: studyContent, onFlyTo, callout, industryNote }: HeatStoryPanelProps) {
  const first = data.years.at(0)
  const last = data.years.at(-1)
  const summers = data.years.length
  const yearRange = first === undefined || last === undefined ? "" : `${first}–${last}`
  const latestStats = last === undefined ? null : statsForYear(data, last)
  const spot = latestStats?.hottestNonIndustrial ?? null
  const sensitiveBuildings = rankSensitiveBuildings(data)
  const study = studyStatus(data.studyComparison, studyContent)
  const comparison = study && study.status !== "not-compared" ? study.comparison : null

  return (
    <FloatingCard className="w-[28rem]">
      <CardHeader className="pb-2 space-y-1">
        <h3 className="font-semibold text-sm">
          {study?.status === "agrees"
            ? study.content.agreesTitle
            : `Summer surface temperature in ${communeName}, observed by satellite since ${first ?? ""}`}
        </h3>
        <StudyIntro study={study} summers={summers} yearRange={yearRange} />
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
              {formatCelsiusDifference(spot?.anomalyC ?? null)}
            </div>
            <div className="text-muted-foreground">
              Hottest public/residential spot, {last}
              {spot?.place ? ` — ${spot.place}` : ""}
            </div>
          </button>
          <div className="rounded-md bg-muted px-2.5 py-2">
            <div className="font-semibold text-base">
              {sensitiveBuildings.everInHottest} of {data.buildings.length}
            </div>
            <div className="text-muted-foreground">
              Schools &amp; care sites in the hottest 10%
              {sensitiveBuildings.shown.length > 0 && (
                <>
                  {" — "}
                  {shownBuildingsText(sensitiveBuildings, summers)}
                </>
              )}
            </div>
          </div>
        </div>

        {callout}

        <div className="text-xs text-muted-foreground pt-2 border-t flex flex-col gap-1">
          {industryNote && <p>{industryNote}</p>}
          <p>
            Satellite: surface temperature, ~11:00, 100m, June–August median.
            {studyContent && ` ${studyContent.methodNote}`}
          </p>
        </div>
      </CardContent>
    </FloatingCard>
  )
}

interface HeatHotspotListProps {
  points: StudyComparisonPoint[]
  coldestHotPointC: number
  warmestCoolPointC: number
  cleanSeparation: boolean
  yearRange: string
  onFlyTo: (lngLat: LngLat) => void
}

interface HotspotRowProps {
  point: StudyComparisonPoint
  barPct: number
  onFlyTo: (lngLat: LngLat) => void
}

function HotspotRow({ point, barPct, onFlyTo }: HotspotRowProps) {
  return (
    <button type="button" onClick={() => onFlyTo(point.lngLat)} className="relative w-full text-left rounded overflow-hidden">
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${barPct}%`,
          background: point.studySays === "hot" ? tokens.heat.study.hot : tokens.heat.study.cool,
          opacity: 0.15,
        }}
      />
      <div className="relative flex items-center justify-between px-2 py-1 text-xs hover:bg-scrim/5 rounded">
        <span>
          {point.name}
          {point.approximate && "*"}
        </span>
        <span className="tabular-nums font-medium shrink-0 pl-2">{formatCelsius(point.tempC)}</span>
      </div>
    </button>
  )
}

export function HeatHotspotList({ points, coldestHotPointC, warmestCoolPointC, cleanSeparation, yearRange, onFlyTo }: HeatHotspotListProps) {
  const { hot, cool } = splitHotspots(points)
  const barPct = hotspotBarPct(points)

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Spots named in the study · satellite surface temperature, June–August median, {yearRange}
      </p>

      <p className="text-xs font-semibold text-study-hot-label px-2 mb-0.5">Named hot</p>
      <div className="flex flex-col">
        {hot.map((point) => (
          <HotspotRow key={point.name} point={point} barPct={barPct(point.tempC)} onFlyTo={onFlyTo} />
        ))}
      </div>

      <div className="flex items-center gap-2 py-1.5">
        <div className="flex-1 border-t border-dashed border-study-separation-line" />
        <span className="text-xs text-study-separation-text font-medium whitespace-nowrap">
          {cleanSeparation ? `${formatCelsius(coldestHotPointC - warmestCoolPointC)} gap — no overlap` : "overlap found"}
        </span>
        <div className="flex-1 border-t border-dashed border-study-separation-line" />
      </div>

      <p className="text-xs font-semibold text-study-cool-label px-2 mb-0.5">Named cool</p>
      <div className="flex flex-col">
        {cool.map((point) => (
          <HotspotRow key={point.name} point={point} barPct={barPct(point.tempC)} onFlyTo={onFlyTo} />
        ))}
      </div>

      {points.some((p) => p.approximate) && <p className="text-xs text-muted-foreground px-2 pt-1">* approximate location</p>}
    </div>
  )
}
