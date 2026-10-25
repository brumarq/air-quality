"use client"

import { useState } from "react"
import type { AirQualityStation } from "@/lib/types/air-quality"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { POLLUTANT_LIMITS } from "@/lib/constants/air-quality-limits"
import { PollutantSummaryTile } from "./pollutant-summary-tile"
import { LimitStatusLegend } from "./limit-status-legend"
import { PollutantSection } from "./pollutant-section"

interface CommuneReadingsPanelProps {
  stations: AirQualityStation[]
}

export function CommuneReadingsPanel({ stations }: CommuneReadingsPanelProps) {
  const [selectedParameter, setSelectedParameter] = useState(POLLUTANT_LIMITS[0].parameter)
  const selectedLimit = POLLUTANT_LIMITS.find((limit) => limit.parameter === selectedParameter)!

  return (
    <Card className="w-96 max-h-[calc(100vh-13rem)] overflow-y-auto shadow-lg">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-base">Live readings</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {POLLUTANT_LIMITS.map((limit) => (
            <PollutantSummaryTile
              key={limit.parameter}
              limit={limit}
              selected={limit.parameter === selectedParameter}
              onSelect={() => setSelectedParameter(limit.parameter)}
            />
          ))}
        </div>

        <LimitStatusLegend />

        <div className="mt-2">
          <PollutantSection stations={stations} limit={selectedLimit} />
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t mt-2">
          EU limits are annual means. Averages over shorter periods are indicative only.
        </p>
      </CardContent>
    </Card>
  )
}
