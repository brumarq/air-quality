"use client"

import { NO2_TARGET_YEAR, POLLUTANT_LIMITS } from "@/shared/domain/limits"
import { StatusCard } from "@/shared/ui/status-card"
import type { AreaTubes } from "./use-area-tubes"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { NO2_BAND_COLOR, classifyNo2, getReading, getReductionNeeded, type No2Tube, type No2TubeDataset, type Reduction, type ReductionNeeded } from "./model"
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BackButton } from "@/shared/ui/back-button"
import { tokens } from "@/shared/theme/tokens"
import {
  MISSING,
  formatConcentration,
  formatConcentrationDifferenceNumber,
  formatConcentrationNumber,
  formatLimit,
  formatPercentChange,
} from "@/shared/lib/numbers"

export function sharedLatestYear(reductions: ReductionNeeded[]): number | null {
  const years = new Set(reductions.flatMap((r) => (r.status === "ok" ? [r.latestYear] : [])))
  return years.size === 1 ? ([...years][0] ?? null) : null
}

function neededPerYearText(reduction: Reduction): string {
  switch (reduction.kind) {
    case "at-or-below":
      return "already below"
    case "deadline-reached":
      return MISSING
    case "needed":
      return formatConcentrationDifferenceNumber(-reduction.perYear)
  }
}

export function campaignYearBars(dataset: No2TubeDataset, tube: No2Tube): { year: number; value: number | null }[] {
  return dataset.campaignYears.map((year) => ({ year, value: getReading(tube, year) }))
}

interface No2TubesCardsProps {
  tubes: AreaTubes
  selectedTubeId: string | null
  onSelectTube: (tubeId: string | null) => void
}

export function No2TubesCards({ tubes, selectedTubeId, onSelectTube }: No2TubesCardsProps) {
  switch (tubes.status) {
    case "none":
      return null
    case "loading":
      return <StatusCard role="status">Loading NO₂ tube data...</StatusCard>
    case "error":
      return <StatusCard role="alert">Couldn&apos;t load NO₂ tube data.</StatusCard>
    case "ready":
      return selectedTubeId ? (
        <NO2TubeDetailCard dataset={tubes.dataset} tubeId={selectedTubeId} onBack={() => onSelectTube(null)} />
      ) : (
        <NO2ReductionCard dataset={tubes.dataset} selectedTubeId={selectedTubeId} onSelectTube={onSelectTube} />
      )
  }
}

interface NO2ReductionCardProps {
  dataset: No2TubeDataset
  selectedTubeId: string | null
  onSelectTube: (id: string) => void
}

export function NO2ReductionCard({ dataset, selectedTubeId, onSelectTube }: NO2ReductionCardProps) {
  const reductions = getReductionNeeded(dataset)
  const sharedYear = sharedLatestYear(reductions)

  return (
    <FloatingCard>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-sm">
          NO₂ tubes · distance to the {formatLimit(POLLUTANT_LIMITS.no2.limit2030)} {NO2_TARGET_YEAR} value
        </h3>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 pr-2 font-medium">Site</th>
              <th className="py-1 px-2 font-medium text-right">{sharedYear ?? "Latest"}</th>
              <th className="py-1 px-2 font-medium text-right">vs 2030</th>
              <th className="py-1 px-2 font-medium text-right">Needed/yr</th>
              <th className="py-1 pl-2 font-medium text-right">Last yr</th>
            </tr>
          </thead>
          <tbody>
            {reductions.map((r) => (
              <tr
                key={r.tubeId}
                onClick={() => onSelectTube(r.tubeId)}
                className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                  selectedTubeId === r.tubeId ? "bg-muted" : ""
                }`}
              >
                <td className="py-1.5 pr-2">{r.name}</td>
                {r.status === "no-data" ? (
                  <>
                    <td className="py-1.5 px-2 text-right tabular-nums">No reading</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-no2-below-target">{MISSING}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{MISSING}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">{MISSING}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {formatConcentrationNumber(r.latestValue)}
                      {sharedYear === null && <span className="text-muted-foreground"> ({r.latestYear})</span>}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right tabular-nums ${
                        r.pctVsTarget > 0 ? "text-no2-above-target" : "text-no2-below-target"
                      }`}
                    >
                      {formatPercentChange(r.pctVsTarget)}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{neededPerYearText(r.reduction)}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">{formatConcentrationDifferenceNumber(r.changeVsPreviousYear)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground pt-2 mt-2 border-t">
          Indicative tube measurements, not a compliance check — formal compliance is assessed at the official
          reference stations. Click a row or a map pin for the full history.
        </p>
      </CardContent>
    </FloatingCard>
  )
}

const readingTooltip = (value: unknown) => (typeof value === "number" ? [formatConcentration(value), ""] : ["no reading", ""])

interface NO2TubeDetailCardProps {
  dataset: No2TubeDataset
  tubeId: string
  onBack: () => void
}

export function NO2TubeDetailCard({ dataset, tubeId, onBack }: NO2TubeDetailCardProps) {
  const tube = dataset.tubes.find((t) => t.id === tubeId)
  if (!tube) return null
  const first = dataset.campaignYears.at(0)
  const last = dataset.campaignYears.at(-1)
  const yearRange = first === undefined || last === undefined ? "" : `${first}–${last}`
  const bars = campaignYearBars(dataset, tube)

  return (
    <FloatingCard>
      <CardHeader className="pb-2 space-y-2">
        <BackButton label="Back to tubes" onClick={onBack} />
        <div>
          <h3 className="font-semibold text-sm">{tube.name}</h3>
          <p className="text-xs text-muted-foreground">NO₂ tube · {yearRange}</p>
        </div>
      </CardHeader>
      <CardContent>
        {tube.approximateLocation && (
          <p className="text-xs text-notice-foreground bg-notice rounded px-2 py-1 mb-2">
            Approximate location — street matched, exact house number not confirmed.
          </p>
        )}
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" fontSize={11} stroke={tokens.chart.axis} />
            <YAxis fontSize={11} stroke={tokens.chart.axis} width={28} />
            <Tooltip formatter={readingTooltip} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {bars.map((bar) => (
                <Cell key={bar.year} fill={bar.value === null ? tokens.chart.noData : NO2_BAND_COLOR[classifyNo2(bar.value)]} />
              ))}
            </Bar>
            <ReferenceLine y={POLLUTANT_LIMITS.no2.limitToday} stroke={tokens.limit.today} strokeDasharray="4 3" />
            <ReferenceLine y={POLLUTANT_LIMITS.no2.limit2030} stroke={tokens.limit.target2030} strokeDasharray="4 3" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 text-xs text-ink-strong pt-1">
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed" style={{ borderColor: tokens.limit.target2030 }} />
            {NO2_TARGET_YEAR} limit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed" style={{ borderColor: tokens.limit.today }} />
            Today&apos;s limit
          </span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 mt-2 border-t">
          Indicative passive-tube measurement, corrected for method uncertainty — not a compliance check. Source:
          Pacte Climat NO₂ campaign, Administration de l&apos;environnement.
        </p>
      </CardContent>
    </FloatingCard>
  )
}
