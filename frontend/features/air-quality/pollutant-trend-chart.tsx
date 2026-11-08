"use client"

import { Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PollutantLimit } from "@/domain/limits"
import type { TimeRangeOption } from "@/domain/time-ranges"
import type { StationHistory } from "@/domain/air-quality"
import { bucketTrendData } from "@/domain/chart-bucketing"
import { STATION_COLORS, LIMIT_TODAY_COLOR, LIMIT_2030_COLOR } from "@/domain/limits"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface PollutantTrendChartProps {
  history: StationHistory[] | null
  limit: PollutantLimit
  range: TimeRangeOption
}

export function PollutantTrendChart({ history, limit, range }: PollutantTrendChartProps) {
  const to = new Date()
  const from = new Date(to.getTime() - range.days * 24 * 60 * 60 * 1000)

  const { rows, formatTick } = history
    ? bucketTrendData(history, range.key, from, to)
    : { rows: null, formatTick: (t: string) => t }

  const earliestTimestamp = history
    ? history
        .flatMap(({ points }) => points.map((p) => p.timestamp))
        .sort()
        .at(0) ?? null
    : null

  return (
    <Card className="pointer-events-auto w-full shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
            <h3 className="font-semibold text-sm">{limit.label} history · {limit.unit}</h3>
            {range.live && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
                </span>
                Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-strong">
            {history?.map(({ station }, i) => (
              <span key={station.id} className="flex items-center gap-2">
                <span className="w-4 h-1 rounded-sm" style={{ background: STATION_COLORS[i % STATION_COLORS.length] }} />
                {station.name}
              </span>
            ))}
            <span className="flex items-center gap-2">
              <span className="w-4 border-t border-dashed" style={{ borderColor: LIMIT_2030_COLOR }} />
              2030 limit
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 border-t border-dashed" style={{ borderColor: LIMIT_TODAY_COLOR }} />
              Today&apos;s limit
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="min-h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : earliestTimestamp === null ? (
          <div className="min-h-48 flex items-center justify-center text-sm text-muted-foreground">
            No history for this pollutant yet.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTick}
                  fontSize={11}
                  stroke="#737373"
                  minTickGap={24}
                />
                <YAxis fontSize={11} stroke="#737373" width={32} />
                <Tooltip
                  labelFormatter={(value: string) => formatTick(value)}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)} ${limit.unit}`, name]}
                  allowEscapeViewBox={{ x: false, y: false }}
                  position={{ y: 0 }}
                />
                {history!.map(({ station }, i) => (
                  <Line
                    key={station.id}
                    dataKey={station.name}
                    name={station.name}
                    stroke={STATION_COLORS[i % STATION_COLORS.length]}
                    strokeWidth={1.75}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
                {range.live &&
                  history!.map(({ station, points }, i) => {
                    const last = points[points.length - 1]
                    if (!last) return null
                    return (
                      <ReferenceDot
                        key={station.id}
                        x={last.timestamp}
                        y={last.value}
                        r={5}
                        fill={STATION_COLORS[i % STATION_COLORS.length]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        isFront
                      />
                    )
                  })}
                <ReferenceLine y={limit.limitToday} stroke={LIMIT_TODAY_COLOR} strokeDasharray="4 3" />
                <ReferenceLine y={limit.limit2030} stroke={LIMIT_2030_COLOR} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
              Hover for exact values. Shaded: a station has no data.
              {earliestTimestamp &&
                ` Data since ${new Date(earliestTimestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
