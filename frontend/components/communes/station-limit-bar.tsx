"use client"

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { AirQualityStation, Sensor } from "@/lib/types/air-quality"
import { LIMIT_STATUS_COLOR, getLimitStatus, type PollutantLimit } from "@/lib/constants/air-quality-limits"

interface StationLimitBarProps {
  station: AirQualityStation
  sensor: Sensor | undefined
  limit: PollutantLimit
}

export function StationLimitBar({ station, sensor, limit }: StationLimitBarProps) {
  const hasValidReading = sensor?.lastValue != null && sensor.unit === limit.unit

  if (!hasValidReading) {
    return (
      <div className="py-2">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium">{station.name}</span>
          <span className="text-sm text-muted-foreground">No data</span>
        </div>
        <div className="h-[10px] rounded bg-muted" />
        <div className="text-xs text-muted-foreground mt-1">
          No recent reading
          {sensor?.lastUpdated && ` · offline since ${new Date(sensor.lastUpdated).toLocaleDateString()}`}
        </div>
      </div>
    )
  }

  const value = sensor.lastValue as number
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
      {sensor.lastUpdated && (
        <div className="text-[11px] text-muted-foreground mt-1">{new Date(sensor.lastUpdated).toLocaleString()}</div>
      )}
    </div>
  )
}
