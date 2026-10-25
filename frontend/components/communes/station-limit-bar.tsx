"use client"

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { AirQualityStation, SensorReadingHistoryPoint } from "@/lib/types/air-quality"
import { LIMIT_STATUS_COLOR, getLimitStatus, type PollutantLimit } from "@/lib/constants/air-quality-limits"

interface StationLimitBarProps {
  station: AirQualityStation
  points: SensorReadingHistoryPoint[]
  limit: PollutantLimit
  live: boolean
}

export function StationLimitBar({ station, points, limit, live }: StationLimitBarProps) {
  const matching = points.filter((p) => p.unit === limit.unit)

  if (matching.length === 0) {
    return (
      <div className="py-2">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium">{station.name}</span>
          <span className="text-sm text-muted-foreground">No data</span>
        </div>
        <div className="h-[10px] rounded bg-muted" />
        <div className="text-xs text-muted-foreground mt-1">No recent reading for this period</div>
      </div>
    )
  }

  const latestTimestamp = matching[matching.length - 1].timestamp
  const value = live
    ? matching[matching.length - 1].value
    : matching.reduce((sum, p) => sum + p.value, 0) / matching.length
  const domainMax = Math.max(limit.limitToday, limit.limit2030, value) * 1.15
  const status = getLimitStatus(value, limit)

  return (
    <div className="py-2">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium">{station.name}</span>
        <span className="text-sm font-semibold">{value.toFixed(1)}</span>
      </div>
      <ResponsiveContainer width="100%" height={16}>
        <BarChart
          layout="vertical"
          data={[{ name: limit.parameter, value }]}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis type="number" domain={[0, domainMax]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="value" fill={LIMIT_STATUS_COLOR[status]} radius={2} barSize={10} />
          <ReferenceLine x={limit.limitToday} stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
          <ReferenceLine x={limit.limit2030} stroke="hsl(var(--destructive))" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-[11px] text-muted-foreground mt-1">
        {live
          ? `Latest reading · ${new Date(latestTimestamp).toLocaleString()}`
          : `Average of ${matching.length} reading${matching.length === 1 ? "" : "s"} · latest ${new Date(latestTimestamp).toLocaleString()}`}
      </div>
    </div>
  )
}
