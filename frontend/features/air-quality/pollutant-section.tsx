import { STATION_COLORS, type PollutantLimit } from "@/domain/limits"
import type { StationHistory } from "@/domain/air-quality"
import { StationLimitBar } from "./station-limit-bar"

interface PollutantSectionProps {
  history: StationHistory[]
  limit: PollutantLimit
  live: boolean
}

export function PollutantSection({ history, limit, live }: PollutantSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold">
          {limit.label} by station · {limit.unit}
        </h4>
        <span className="flex gap-3 text-xs font-medium">
          <span className="text-limit-target">2030: {limit.limit2030}</span>
          <span className="text-limit-today">today: {limit.limitToday}</span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {history.map(({ station, points }, i) => (
          <StationLimitBar
            key={station.id}
            station={station}
            color={STATION_COLORS[i % STATION_COLORS.length]}
            points={points}
            limit={limit}
            live={live}
          />
        ))}
      </div>
    </div>
  )
}
