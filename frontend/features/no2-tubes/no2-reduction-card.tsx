"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { NO2TubeDataset } from "@/domain/no2-tubes"
import { getReductionNeeded } from "@/domain/no2-tubes"

interface NO2ReductionCardProps {
  dataset: NO2TubeDataset
  selectedTubeId: string | null
  onSelectTube: (id: string) => void
}

// The card Step 2.5 is actually for: not a trend line through a handful of noisy
// points, but the reduction each site needs per year to reach the 2030 value, plus
// its last year-over-year change. See ESCH-HEAT-PROFILE-PLAN.md Step 2.5.
export function NO2ReductionCard({ dataset, selectedTubeId, onSelectTube }: NO2ReductionCardProps) {
  const rows = getReductionNeeded(dataset)

  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-sm">
          NO₂ tubes · distance to the {dataset.limit2030} {dataset.unit} 2030 value
        </h3>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 pr-2 font-medium">Site</th>
              <th className="py-1 px-2 font-medium text-right">{rows[0]?.latestYear ?? ""}</th>
              <th className="py-1 px-2 font-medium text-right">vs 2030</th>
              <th className="py-1 px-2 font-medium text-right">Needed/yr</th>
              <th className="py-1 pl-2 font-medium text-right">Last yr</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.tubeId}
                onClick={() => onSelectTube(row.tubeId)}
                className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                  selectedTubeId === row.tubeId ? "bg-muted" : ""
                }`}
              >
                <td className="py-1.5 pr-2">{row.name}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{row.latestValue}</td>
                <td
                  className={`py-1.5 px-2 text-right tabular-nums ${
                    row.pctVsTarget > 0 ? "text-no2-above-target" : "text-no2-below-target"
                  }`}
                >
                  {row.pctVsTarget > 0 ? "+" : ""}
                  {row.pctVsTarget.toFixed(0)}%
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {row.neededPerYear === null ? "already below" : `−${row.neededPerYear.toFixed(1)}`}
                </td>
                <td className="py-1.5 pl-2 text-right tabular-nums">
                  {row.lastYearChange === null
                    ? "—"
                    : `${row.lastYearChange > 0 ? "+" : ""}${row.lastYearChange}`}
                </td>
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
