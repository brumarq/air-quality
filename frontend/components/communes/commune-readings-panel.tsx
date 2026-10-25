import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { POLLUTANT_LIMITS, type PollutantLimit } from "@/lib/constants/air-quality-limits"
import type { StationHistory } from "@/hooks/use-sensor-history"
import { PollutantSummaryTile } from "./pollutant-summary-tile"
import { LimitStatusLegend } from "./limit-status-legend"
import { PollutantSection } from "./pollutant-section"

interface CommuneReadingsPanelProps {
  history: StationHistory[] | null
  selectedLimit: PollutantLimit
  live: boolean
  onSelectParameter: (parameter: string) => void
}

export function CommuneReadingsPanel({ history, selectedLimit, live, onSelectParameter }: CommuneReadingsPanelProps) {
  return (
    <Card className="w-96 max-h-[calc(100vh-13rem)] overflow-y-auto shadow-lg">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-base">Readings</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {POLLUTANT_LIMITS.map((limit) => (
            <PollutantSummaryTile
              key={limit.parameter}
              limit={limit}
              selected={limit.parameter === selectedLimit.parameter}
              onSelect={() => onSelectParameter(limit.parameter)}
            />
          ))}
        </div>

        <LimitStatusLegend />

        <div className="mt-2">
          {history === null ? (
            <div className="py-6 text-sm text-muted-foreground text-center">Loading...</div>
          ) : (
            <PollutantSection history={history} limit={selectedLimit} live={live} />
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t mt-2">
          EU limits are annual means. Averages over shorter periods are indicative only.
        </p>
      </CardContent>
    </Card>
  )
}
