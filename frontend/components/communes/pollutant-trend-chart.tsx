"use client"

import { Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PollutantLimit } from "@/lib/constants/air-quality-limits"
import type { TimeRangeOption } from "@/lib/constants/time-ranges"
import type { StationHistory } from "@/hooks/use-sensor-history"
import { bucketTrendData } from "@/lib/chart-bucketing"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface PollutantTrendChartProps {
  history: StationHistory[] | null
  limit: PollutantLimit
  range: TimeRangeOption
}

const LINE_COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-3))"]

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
    <Card className="w-[36rem] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-base flex items-center gap-1.5">
            {limit.label} history · {limit.unit}
            {range.live && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                Live
              </span>
            )}
          </h3>
          <span className="text-xs text-muted-foreground">
            <span className="text-destructive">2030: {limit.limit2030}</span> · today: {limit.limitToday}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : earliestTimestamp === null ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No history for this pollutant yet.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={224}>
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTick}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  minTickGap={24}
                />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" width={32} />
                <Tooltip
                  labelFormatter={(value: string) => formatTick(value)}
                  formatter={(value: number) => [`${value.toFixed(1)} ${limit.unit}`, limit.label]}
                />
                {history!.map(({ station }, i) => (
                  <Line
                    key={station.id}
                    dataKey={station.name}
                    name={station.name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
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
                        fill={LINE_COLORS[i % LINE_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                        isFront
                      />
                    )
                  })}
                <ReferenceLine y={limit.limitToday} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <ReferenceLine y={limit.limit2030} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              {history!.map(({ station }, i) => (
                <span key={station.id} className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
                  {station.name}
                </span>
              ))}
            </div>
            {earliestTimestamp && (
              <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                Data since {new Date(earliestTimestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
