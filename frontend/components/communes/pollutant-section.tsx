import type { PollutantLimit } from "@/lib/constants/air-quality-limits"
import type { StationHistory } from "@/hooks/use-sensor-history"
import { StationLimitBar } from "./station-limit-bar"

interface PollutantSectionProps {
  history: StationHistory[]
  limit: PollutantLimit
  live: boolean
}

export function PollutantSection({ history, limit, live }: PollutantSectionProps) {
  return (
    <div className="py-3 border-t first:border-t-0 first:pt-0">
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="text-sm font-semibold">
          {limit.label} by station · {limit.unit}
        </h4>
        <span className="text-xs text-muted-foreground">
          <span className="text-destructive">2030: {limit.limit2030}</span> · today: {limit.limitToday}
        </span>
      </div>
      <div className="divide-y">
        {history.map(({ station, points }) => (
          <StationLimitBar key={station.id} station={station} points={points} limit={limit} live={live} />
        ))}
      </div>
    </div>
  )
}
