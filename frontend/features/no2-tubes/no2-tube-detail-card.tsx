"use client"

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { No2Limits } from "@/domain/limits"
import { classifyNo2, getReading, type No2TubeDataset } from "@/domain/no2-tubes"
import { tokens } from "@/theme/tokens"
import { NO2_BAND_COLOR } from "./no2-band-colors"

interface NO2TubeDetailCardProps {
  dataset: No2TubeDataset
  limits: No2Limits
  tubeId: string
  onBack: () => void
}

export function NO2TubeDetailCard({ dataset, limits, tubeId, onBack }: NO2TubeDetailCardProps) {
  const tube = dataset.tubes.find((t) => t.id === tubeId)
  if (!tube) return null

  const years = dataset.campaignYears
  const rows = years.map((year) => {
    const value = getReading(tube, year)
    return { year: String(year), value, color: value === null ? tokens.chart.noData : NO2_BAND_COLOR[classifyNo2(value, limits)] }
  })

  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardHeader className="pb-2 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 -ml-2 px-2 w-fit text-xs text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to tubes
        </Button>
        <div>
          <h3 className="font-semibold text-sm">{tube.name}</h3>
          <p className="text-xs text-muted-foreground">NO₂ tube · {years[0]}–{years[years.length - 1]}</p>
        </div>
      </CardHeader>
      <CardContent>
        {tube.approximateLocation && (
          <p className="text-xs text-notice-foreground bg-notice rounded px-2 py-1 mb-2">
            Approximate location — street matched, exact house number not confirmed.
          </p>
        )}
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" fontSize={11} stroke={tokens.chart.axis} />
            <YAxis fontSize={11} stroke={tokens.chart.axis} width={28} />
            <Tooltip
              formatter={(value: number) => (value === null ? ["no reading", ""] : [`${value} ${dataset.unit}`, ""])}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {rows.map((row) => (
                <Cell key={row.year} fill={row.color} />
              ))}
            </Bar>
            <ReferenceLine y={limits.limitToday} stroke={tokens.limit.today} strokeDasharray="4 3" />
            <ReferenceLine y={limits.limitTarget} stroke={tokens.limit.target2030} strokeDasharray="4 3" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 text-xs text-ink-strong pt-1">
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed" style={{ borderColor: tokens.limit.target2030 }} />
            2030 limit
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
    </Card>
  )
}
