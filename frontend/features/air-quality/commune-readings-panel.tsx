import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { POLLUTANT_LIMITS, POLLUTANT_PARAMETERS, type PollutantLimit, type PollutantParameter } from "@/domain/limits"
import type { TimeRangeOption } from "@/domain/time-ranges"
import type { AsyncState } from "@/lib/use-async"
import type { SensorHistory } from "./use-sensor-history"
import { PollutantSummaryTile } from "./pollutant-summary-tile"
import { LimitStatusLegend } from "./limit-status-legend"
import { PollutantSection } from "./pollutant-section"

interface CommuneReadingsPanelProps {
  history: AsyncState<SensorHistory>
  selectedLimit: PollutantLimit
  range: TimeRangeOption
  onSelectParameter: (parameter: PollutantParameter) => void
}

function footnoteFor(range: TimeRangeOption): string {
  switch (range.key) {
    case "live":
      return "Single hourly values. EU limits are annual means, so this is indicative only."
    case "day":
    case "week":
    case "month":
      return "EU limits are annual means. Averages over shorter periods are indicative only."
    case "year":
      return "EU limits are annual means, judged per calendar year. A rolling 12-month mean is indicative."
  }
}

export function CommuneReadingsPanel({ history, selectedLimit, range, onSelectParameter }: CommuneReadingsPanelProps) {
  return (
    <Card className="pointer-events-auto w-96 flex-1 min-h-0 flex flex-col shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base">Air quality</h3>
          <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-ink-soft">{range.chip}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {POLLUTANT_PARAMETERS.map((parameter) => POLLUTANT_LIMITS[parameter]).map((limit) => (
            <PollutantSummaryTile
              key={limit.parameter}
              limit={limit}
              selected={limit.parameter === selectedLimit.parameter}
              onSelect={() => onSelectParameter(limit.parameter)}
            />
          ))}
        </div>

        <LimitStatusLegend />

        <div className="flex-1 min-h-0 overflow-y-auto pt-4 border-t">
          {history.status === "loading" ? (
            <div className="py-6 text-sm text-muted-foreground text-center">Loading...</div>
          ) : history.status === "error" ? (
            <div role="alert" className="py-6 text-sm text-muted-foreground text-center">
              Couldn&apos;t load readings.
            </div>
          ) : (
            <PollutantSection history={history.data.stations} limit={selectedLimit} live={range.live} />
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t shrink-0">{footnoteFor(range)}</p>
      </CardContent>
    </Card>
  )
}
