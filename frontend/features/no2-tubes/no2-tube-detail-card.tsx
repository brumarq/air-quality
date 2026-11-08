"use client"

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LIMIT_TODAY_COLOR, LIMIT_2030_COLOR } from "@/domain/limits"
import type { NO2TubeDataset } from "@/domain/no2-tubes"
import { getTubeColor, getTubeYears } from "@/domain/no2-tubes"

interface NO2TubeDetailCardProps {
  dataset: NO2TubeDataset
  tubeId: string
  onBack: () => void
}

export function NO2TubeDetailCard({ dataset, tubeId, onBack }: NO2TubeDetailCardProps) {
  const tube = dataset.tubes.find((t) => t.id === tubeId)
  if (!tube) return null

  const years = getTubeYears(dataset)
  const rows = years.map((year) => ({
    year: String(year),
    value: tube.readings[String(year)] ?? null,
    source: dataset.sources[String(year)],
  }))

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
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
            Approximate location — street matched, exact house number not confirmed.
          </p>
        )}
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" fontSize={11} stroke="#737373" />
            <YAxis fontSize={11} stroke="#737373" width={28} />
            <Tooltip
              formatter={(value: number) => (value === null ? ["no reading", ""] : [`${value} ${dataset.unit}`, ""])}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {rows.map((row) => (
                <Cell key={row.year} fill={row.value === null ? "#E5E7EB" : getTubeColor(row.value, dataset)} />
              ))}
            </Bar>
            <ReferenceLine y={dataset.limitToday} stroke={LIMIT_TODAY_COLOR} strokeDasharray="4 3" />
            <ReferenceLine y={dataset.limit2030} stroke={LIMIT_2030_COLOR} strokeDasharray="4 3" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 text-xs text-neutral-700 pt-1">
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed" style={{ borderColor: LIMIT_2030_COLOR }} />
            2030 limit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed" style={{ borderColor: LIMIT_TODAY_COLOR }} />
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
