"use client"

import { memo } from "react"
import { min } from "date-fns"
import { Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PollutantLimit } from "@/shared/domain/limits"
import { bucketTrend, LUXEMBOURG_TIME_ZONE, type Granularity, type TimeWindow } from "./time"
import type { AsyncState } from "@/shared/lib/use-async"
import { tokens } from "@/shared/theme/tokens"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { type Reading, type SensorHistory, type StationHistory, type TimeRangeOption, stationColor } from "./model"
import { LOCALE, formatConcentration } from "@/shared/lib/numbers"

type ChartRow = { bucketStartMs: number } & Record<string, number | null>

const dataKeyFor = (stationId: number) => `station-${stationId}`

export function chartRows(history: StationHistory[], unit: string, granularity: Granularity, window: TimeWindow): ChartRow[] {
  const { axis, series } = bucketTrend(history, unit, granularity, window)
  return axis.map((start, i) => {
    const row: ChartRow = { bucketStartMs: start.getTime() }
    for (const { stationId, points } of series) row[dataKeyFor(stationId)] = points[i] ?? null
    return row
  })
}

export function latestReading(points: Reading[], unit: string): Reading | undefined {
  return points.findLast((p) => p.unit === unit)
}

export function earliestReading(history: StationHistory[], unit: string): Date | null {
  const times = history.flatMap(({ points }) => points.filter((p) => p.unit === unit).map((p) => p.at))
  return times.length === 0 ? null : min(times)
}

const timeZone = LUXEMBOURG_TIME_ZONE
const TICK_FORMATS: Record<Granularity, Intl.DateTimeFormat> = {
  hour: new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone }),
  day: new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone }),
  month: new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone }),
}
const dataSince = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone })

export const formatTick = (granularity: Granularity, t: number) => TICK_FORMATS[granularity].format(t)

export const formatDataSince = (at: Date) => dataSince.format(at)

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

interface TrendChartProps {
  history: StationHistory[]
  window: TimeWindow
  limit: PollutantLimit
  range: TimeRangeOption
}

const TrendChart = memo(function TrendChart({ history, window, limit, range }: TrendChartProps) {
  const tick = (t: number) => formatTick(range.granularity, t)
  const rows = chartRows(history, limit.unit, range.granularity, window)
  const bucketContaining = (at: Date) => rows.findLast((row) => row.bucketStartMs <= at.getTime())?.bucketStartMs

  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="bucketStartMs" tickFormatter={tick} fontSize={11} stroke={tokens.chart.axis} minTickGap={24} />
        <YAxis fontSize={11} stroke={tokens.chart.axis} width={32} />
        <Tooltip
          labelFormatter={tick}
          formatter={(value: number, name: string) => [formatConcentration(value), name]}
          allowEscapeViewBox={{ x: false, y: false }}
          position={{ y: 0 }}
        />
        {history.map(({ station }, i) => (
          <Line
            key={station.id}
            dataKey={dataKeyFor(station.id)}
            name={station.name}
            stroke={stationColor(i)}
            strokeWidth={1.75}
            dot={false}
            connectNulls={false}
          />
        ))}
        {range.live &&
          history.map(({ station, points }, i) => {
            const latest = latestReading(points, limit.unit)
            if (!latest) return null
            return (
              <ReferenceDot
                key={station.id}
                x={bucketContaining(latest.at)}
                y={latest.value}
                r={5}
                fill={stationColor(i)}
                stroke={tokens.chart.liveDotStroke}
                strokeWidth={2}
                isFront
              />
            )
          })}
        <ReferenceLine y={limit.limitToday} stroke={tokens.limit.today} strokeDasharray="4 3" />
        <ReferenceLine y={limit.limit2030} stroke={tokens.limit.target2030} strokeDasharray="4 3" />
      </LineChart>
    </ResponsiveContainer>
  )
})

export function PollutantTrendChart({ history, limit, range }: PollutantTrendChartProps) {
  const stations = history.status === "ready" ? history.data.stations : []
  const earliestAt = earliestReading(stations, limit.unit)

  return (
    <FloatingCard className="w-full">
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
            {stations.map(({ station }, i) => (
              <span key={station.id} className="flex items-center gap-2">
                <span className="w-4 h-1 rounded-sm" style={{ background: stationColor(i) }} />
                {station.name}
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
        ) : history.status === "loading" ? (
          <ChartMessage>Loading...</ChartMessage>
        ) : earliestAt === null ? (
          <ChartMessage>No history for this pollutant yet.</ChartMessage>
        ) : (
          <>
            <TrendChart history={stations} window={history.data.window} limit={limit} range={range} />
            <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
              Hover for exact values. Shaded: a station has no data. Data since {formatDataSince(earliestAt)}.
            </p>
          </>
        )}
      </CardContent>
    </FloatingCard>
  )
}
