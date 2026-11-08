"use client"

import type { StudyComparisonPoint } from "@/domain/heat"
import type { LngLat } from "@/domain/shared/geo"
import { tokens } from "@/theme/tokens"

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
  /** Width of the in-row temperature bar, 0-100. */
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
        <span className="tabular-nums font-medium shrink-0 pl-2">{point.tempC.toFixed(1)}°C</span>
      </div>
    </button>
  )
}

/** Maps each temperature onto 0-100% of a scale padded half a degree past the extremes. */
function barScale(points: StudyComparisonPoint[]): (tempC: number) => number {
  if (points.length === 0) return () => 0
  const temps = points.map((p) => p.tempC)
  const min = Math.floor(Math.min(...temps) - 0.5)
  const max = Math.ceil(Math.max(...temps) + 0.5)
  return (tempC) => ((tempC - min) / (max - min)) * 100
}

/**
 * The study's named points vs. satellite, as a two-group list rather than a dot strip:
 * place names are what an officer recognises on sight. Each row keeps the strip's
 * at-a-glance effect with an in-row temperature bar, and flies the map there on click,
 * like the NO2 tube rows.
 */
export function HeatHotspotList({ points, coldestHotPointC, warmestCoolPointC, cleanSeparation, yearRange, onFlyTo }: HeatHotspotListProps) {
  const hotPoints = points.filter((p) => p.studySays === "hot").sort((a, b) => b.tempC - a.tempC)
  const coolPoints = points.filter((p) => p.studySays === "cool").sort((a, b) => b.tempC - a.tempC)
  const barPct = barScale(points)

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Spots named in the study · satellite surface temperature, June–August median, {yearRange}
      </p>

      <p className="text-xs font-semibold text-study-hot-label px-2 mb-0.5">Named hot</p>
      <div className="flex flex-col">
        {hotPoints.map((p) => (
          <HotspotRow key={p.name} point={p} barPct={barPct(p.tempC)} onFlyTo={onFlyTo} />
        ))}
      </div>

      <div className="flex items-center gap-2 py-1.5">
        <div className="flex-1 border-t border-dashed border-study-separation-line" />
        <span className="text-xs text-study-separation-text font-medium whitespace-nowrap">
          {cleanSeparation ? `${(coldestHotPointC - warmestCoolPointC).toFixed(1)}°C gap — no overlap` : "overlap found"}
        </span>
        <div className="flex-1 border-t border-dashed border-study-separation-line" />
      </div>

      <p className="text-xs font-semibold text-study-cool-label px-2 mb-0.5">Named cool</p>
      <div className="flex flex-col">
        {coolPoints.map((p) => (
          <HotspotRow key={p.name} point={p} barPct={barPct(p.tempC)} onFlyTo={onFlyTo} />
        ))}
      </div>

      {points.some((p) => p.approximate) && <p className="text-xs text-muted-foreground px-2 pt-1">* approximate location</p>}
    </div>
  )
}
