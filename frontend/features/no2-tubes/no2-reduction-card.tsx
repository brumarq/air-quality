"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { No2Limits } from "@/domain/limits"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { buildReductionTable } from "./reduction-table-model"

interface NO2ReductionCardProps {
  dataset: No2TubeDataset
  limits: No2Limits
  selectedTubeId: string | null
  onSelectTube: (id: string) => void
}

// Not a trend line through a handful of noisy points, but the reduction each site needs
// per year to reach the 2030 value, plus its change from the year before.
export function NO2ReductionCard({ dataset, limits, selectedTubeId, onSelectTube }: NO2ReductionCardProps) {
  const table = buildReductionTable(dataset, limits)

  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-sm">{table.title}</h3>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 pr-2 font-medium">Site</th>
              <th className="py-1 px-2 font-medium text-right">{table.valueHeader}</th>
              <th className="py-1 px-2 font-medium text-right">vs 2030</th>
              <th className="py-1 px-2 font-medium text-right">Needed/yr</th>
              <th className="py-1 pl-2 font-medium text-right">Last yr</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.tubeId}
                onClick={() => onSelectTube(row.tubeId)}
                className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                  selectedTubeId === row.tubeId ? "bg-muted" : ""
                }`}
              >
                <td className="py-1.5 pr-2">{row.name}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {row.value}
                  {row.valueYear !== null && <span className="text-muted-foreground"> ({row.valueYear})</span>}
                </td>
                <td
                  className={`py-1.5 px-2 text-right tabular-nums ${
                    row.aboveTarget ? "text-no2-above-target" : "text-no2-below-target"
                  }`}
                >
                  {row.vsTarget ?? "—"}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">{row.neededPerYear}</td>
                <td className="py-1.5 pl-2 text-right tabular-nums">{row.changeVsPreviousYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground pt-2 mt-2 border-t">
          Indicative tube measurements, not a compliance check — formal compliance is assessed at the official
          reference stations. Click a row or a map pin for the full history.
        </p>
      </CardContent>
    </Card>
  )
}
