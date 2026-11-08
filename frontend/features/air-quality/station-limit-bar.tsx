import type { AirQualityStation, Reading } from "@/domain/air-quality"
import type { PollutantLimit } from "@/domain/limits"
import { tokens } from "@/theme/tokens"
import { buildStationBar } from "./station-bar-model"

interface StationLimitBarProps {
  station: AirQualityStation
  color: string
  points: Reading[]
  limit: PollutantLimit
  live: boolean
}

export function StationLimitBar({ station, color, points, limit, live }: StationLimitBarProps) {
  const bar = buildStationBar(points, limit, live)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className={`w-4 h-1 rounded-sm -translate-y-1 ${bar.hasData ? "" : "opacity-30"}`} style={{ background: color }} />
          <span className="text-sm font-medium">{station.name}</span>
        </span>
        <span className={bar.hasData ? "text-lg font-semibold tabular-nums" : "text-sm text-muted-foreground"}>{bar.valueText}</span>
      </div>
      <div className="relative h-4">
        <div className="absolute top-1 left-0 right-0 h-2 rounded bg-bar-track" />
        {bar.hasData && (
          <>
            <div className="absolute top-1 left-0 h-2 rounded" style={{ width: `${bar.fillPct}%`, background: bar.fillColor ?? undefined }} />
            <div className="absolute top-0 h-4 w-1 -ml-px" style={{ left: `${bar.limit2030Pct}%`, background: tokens.limit.target2030 }} />
            <div className="absolute top-0 h-4 w-1 -ml-px" style={{ left: `${bar.limitTodayPct}%`, background: tokens.limit.today }} />
          </>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{bar.caption}</span>
      {bar.droppedNote && <span className="text-xs text-muted-foreground">{bar.droppedNote}</span>}
    </div>
  )
}
