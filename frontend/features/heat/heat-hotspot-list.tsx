"use client"

import type mapboxgl from "mapbox-gl"
import type { StudyComparisonPoint } from "@/domain/heat"

interface HeatHotspotListProps {
  points: StudyComparisonPoint[]
  coldestHotPointC: number
  warmestCoolPointC: number
  cleanSeparation: boolean
  yearRange: string
  map: mapboxgl.Map | null
}

/**
 * The study's named points vs. satellite, as a two-group list - kept over a dot-strip
 * visualization on request: place names are what an officer recognises on sight, which
 * a strip of colored dots alone doesn't give them. Each row still carries the dot
 * strip's "see it in one second" effect via an in-row temperature bar, plus a labelled
 * gap divider and click-to-fly, matching the NO2 tube rows' click pattern.
 */
export function HeatHotspotList({
  points,
  coldestHotPointC,
  warmestCoolPointC,
  cleanSeparation,
  yearRange,
  map,
}: HeatHotspotListProps) {
  const hotPoints = points.filter((p) => p.studySays === "hot").sort((a, b) => b.tempC - a.tempC)
  const coolPoints = points.filter((p) => p.studySays === "cool").sort((a, b) => b.tempC - a.tempC)

  const allTemps = points.map((p) => p.tempC)
  const scaleMin = Math.floor(Math.min(...allTemps) - 0.5)
  const scaleMax = Math.ceil(Math.max(...allTemps) + 0.5)
  const barPct = (t: number) => ((t - scaleMin) / (scaleMax - scaleMin)) * 100

  function flyTo(p: StudyComparisonPoint) {
    map?.flyTo({ center: [p.lon, p.lat], zoom: 16 })
  }

  function Row({ p }: { p: StudyComparisonPoint }) {
    return (
      <button
        type="button"
        onClick={() => flyTo(p)}
        className="relative w-full text-left rounded overflow-hidden"
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${barPct(p.tempC)}%`,
            background: p.studySays === "hot" ? "#B2182B" : "#2166AC",
            opacity: 0.15,
          }}
        />
        <div className="relative flex items-center justify-between px-2 py-1 text-xs hover:bg-black/5 rounded">
          <span>
            {p.name}
            {p.approximate && "*"}
          </span>
          <span className="tabular-nums font-medium shrink-0 pl-2">{p.tempC.toFixed(1)}°C</span>
        </div>
      </button>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Spots named in the study · satellite surface temperature, June–August median, {yearRange}
      </p>

      <p className="text-xs font-semibold text-red-800 px-2 mb-0.5">Named hot</p>
      <div className="flex flex-col">
        {hotPoints.map((p) => (
          <Row key={p.name} p={p} />
        ))}
      </div>

      <div className="flex items-center gap-2 py-1.5">
        <div className="flex-1 border-t border-dashed border-emerald-400" />
        <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">
          {cleanSeparation
            ? `${(coldestHotPointC - warmestCoolPointC).toFixed(1)}°C gap — no overlap`
            : "overlap found"}
        </span>
        <div className="flex-1 border-t border-dashed border-emerald-400" />
      </div>

      <p className="text-xs font-semibold text-blue-800 px-2 mb-0.5">Named cool</p>
      <div className="flex flex-col">
        {coolPoints.map((p) => (
          <Row key={p.name} p={p} />
        ))}
      </div>

      {points.some((p) => p.approximate) && (
        <p className="text-xs text-muted-foreground px-2 pt-1">* approximate location</p>
      )}
    </div>
  )
}
