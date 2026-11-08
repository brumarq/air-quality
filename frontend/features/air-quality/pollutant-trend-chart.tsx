"use client"

import { Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PollutantLimit } from "@/domain/limits"
import type { TimeRangeOption } from "@/domain/time-ranges"
import type { AsyncState } from "@/lib/use-async"
import { tokens } from "@/theme/tokens"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDataSince } from "./format-time"
import { buildTrendChartModel, type TrendChartModel } from "./trend-chart-model"
import type { SensorHistory } from "./use-sensor-history"

interface PollutantTrendChartProps {
  history: AsyncState<SensorHistory>
  limit: PollutantLimit
  range: TimeRangeOption
}

function ChartMessage({ children, role }: { children: React.ReactNode; role?: "alert" }) {
  return (
    <div role={role} className="min-h-48 flex items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function TrendChart({ model, limit }: { model: TrendChartModel; limit: PollutantLimit }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={model.rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="t" tickFormatter={model.formatTick} fontSize={11} stroke={tokens.chart.axis} minTickGap={24} />
        <YAxis fontSize={11} stroke={tokens.chart.axis} width={32} />
        <Tooltip
          labelFormatter={(t: number) => model.formatTick(t)}
          formatter={(value: number, name: string) => [`${value.toFixed(1)} ${limit.unit}`, name]}
          allowEscapeViewBox={{ x: false, y: false }}
          position={{ y: 0 }}
        />
        {model.lines.map((line) => (
          <Line
            key={line.stationId}
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={1.75}
            dot={false}
            connectNulls={false}
          />
        ))}
        {model.liveDots.map((dot) => (
          <ReferenceDot
            key={dot.stationId}
            x={dot.t}
            y={dot.value}
            r={5}
            fill={dot.color}
            stroke={tokens.chart.liveDotStroke}
            strokeWidth={2}
            isFront
          />
        ))}
        <ReferenceLine y={limit.limitToday} stroke={tokens.limit.today} strokeDasharray="4 3" />
        <ReferenceLine y={limit.limit2030} stroke={tokens.limit.target2030} strokeDasharray="4 3" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PollutantTrendChart({ history, limit, range }: PollutantTrendChartProps) {
  const model = history.status === "ready" ? buildTrendChartModel(history.data.stations, range, history.data.window) : null

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
            {model?.lines.map((line) => (
              <span key={line.stationId} className="flex items-center gap-2">
                <span className="w-4 h-1 rounded-sm" style={{ background: line.color }} />
                {line.name}
              </span>
            ))}
            <span className="flex items-center gap-2">
              <span className="w-4 border-t border-dashed" style={{ borderColor: tokens.limit.target2030 }} />
              2030 limit
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 border-t border-dashed" style={{ borderColor: tokens.limit.today }} />
              Today&apos;s limit
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.status === "error" ? (
          <ChartMessage role="alert">Couldn&apos;t load readings.</ChartMessage>
        ) : model === null ? (
          <ChartMessage>Loading...</ChartMessage>
        ) : model.earliestAt === null ? (
          <ChartMessage>No history for this pollutant yet.</ChartMessage>
        ) : (
          <>
            <TrendChart model={model} limit={limit} />
            <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
              Hover for exact values. Shaded: a station has no data. Data since {formatDataSince(model.earliestAt)}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
