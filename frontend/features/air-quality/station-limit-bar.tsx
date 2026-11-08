import type { AirQualityStation, SensorReadingHistoryPoint } from "@/domain/air-quality"
import { LIMIT_STATUS_COLOR, LIMIT_TODAY_COLOR, LIMIT_2030_COLOR, getLimitStatus, type PollutantLimit } from "@/domain/limits"

interface StationLimitBarProps {
  station: AirQualityStation
  color: string
  points: SensorReadingHistoryPoint[]
  limit: PollutantLimit
  live: boolean
}

export function StationLimitBar({ station, color, points, limit, live }: StationLimitBarProps) {
  const matching = points.filter((p) => p.unit === limit.unit)
  const scaleMax = limit.limitToday * 1.25
  const todayPct = Math.min(100, (limit.limitToday / scaleMax) * 100)
  const limit2030Pct = Math.min(100, (limit.limit2030 / scaleMax) * 100)

  if (matching.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-4 h-1 rounded-sm opacity-30 -translate-y-1" style={{ background: color }} />
            <span className="text-sm font-medium">{station.name}</span>
          </span>
          <span className="text-sm text-muted-foreground">No data</span>
        </div>
        <div className="relative h-4">
          <div className="absolute top-1 left-0 right-0 h-2 rounded bg-bar-track" />
        </div>
        <span className="text-xs text-muted-foreground">No recent reading for this period</span>
      </div>
    )
  }

  const value = live ? matching[matching.length - 1].value : matching.reduce((sum, p) => sum + p.value, 0) / matching.length
  const latestTimestamp = matching[matching.length - 1].timestamp
  const pct = Math.min(100, (value / scaleMax) * 100)
  const status = getLimitStatus(value, limit)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-4 h-1 rounded-sm -translate-y-1" style={{ background: color }} />
          <span className="text-sm font-medium">{station.name}</span>
        </span>
        <span className="text-lg font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="relative h-4">
        <div className="absolute top-1 left-0 right-0 h-2 rounded bg-bar-track" />
        <div
          className="absolute top-1 left-0 h-2 rounded"
          style={{ width: `${pct}%`, background: LIMIT_STATUS_COLOR[status] }}
        />
        <div
          className="absolute top-0 h-4 w-1 -ml-px"
          style={{ left: `${limit2030Pct}%`, background: LIMIT_2030_COLOR }}
        />
        <div className="absolute top-0 h-4 w-1 -ml-px" style={{ left: `${todayPct}%`, background: LIMIT_TODAY_COLOR }} />
      </div>
      <span className="text-xs text-muted-foreground">
        {live
          ? `Latest reading · ${new Date(latestTimestamp).toLocaleString()}`
          : `Average of ${matching.length} reading${matching.length === 1 ? "" : "s"} · latest ${new Date(latestTimestamp).toLocaleString()}`}
      </span>
    </div>
  )
}
