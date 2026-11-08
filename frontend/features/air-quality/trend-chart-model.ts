import type { StationHistory } from "@/domain/air-quality"
import { bucketTrend } from "@/domain/air-quality/chart-bucketing"
import { bucketStart, LUXEMBOURG_TIME_ZONE, type Granularity, type TimeWindow } from "@/domain/shared/time"
import type { TimeRangeOption } from "@/domain/air-quality/time-ranges"
import { stationColor } from "./station-colors"

/** One Recharts row: a bucket start (epoch ms) and each station's value, keyed by dataKey. */
export type ChartRow = { t: number } & Record<string, number | null>

export interface TrendLine {
  stationId: number
  dataKey: string
  name: string
  color: string
}

export interface LiveDot {
  stationId: number
  t: number
  value: number
  color: string
}

export interface TrendChartModel {
  rows: ChartRow[]
  lines: TrendLine[]
  /** The latest reading per station, marked on the chart in live mode. */
  liveDots: LiveDot[]
  /** The oldest reading in the window, or null when no station has any. */
  earliestAt: Date | null
  formatTick: (t: number) => string
}

const dataKeyFor = (stationId: number) => `station-${stationId}`

function tickFormatter(granularity: Granularity): (t: number) => string {
  const timeZone = LUXEMBOURG_TIME_ZONE
  switch (granularity) {
    case "hour":
      return (t) => new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone })
    case "eightHour":
      return (t) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", timeZone })
    case "day":
      return (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone })
    case "month":
      return (t) => new Date(t).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone })
  }
}

/** Turns fetched history into what the trend chart draws. */
export function buildTrendChartModel(history: StationHistory[], range: TimeRangeOption, window: TimeWindow): TrendChartModel {
  const { axis, series } = bucketTrend(history, range.granularity, window)

  const rows = axis.map((start, i) => {
    const row: ChartRow = { t: start.getTime() }
    for (const { stationId, points } of series) row[dataKeyFor(stationId)] = points[i] ?? null
    return row
  })

  const lines = history.map(({ station }, i) => ({
    stationId: station.id,
    dataKey: dataKeyFor(station.id),
    name: station.name,
    color: stationColor(i),
  }))

  const liveDots = range.live
    ? history.flatMap(({ station, points }, i) => {
        const last = points.at(-1)
        return last
          ? [{ stationId: station.id, t: bucketStart(range.granularity, last.at).getTime(), value: last.value, color: stationColor(i) }]
          : []
      })
    : []

  const earliestAt =
    history
      .flatMap(({ points }) => points.slice(0, 1).map((p) => p.at))
      .sort((a, b) => a.getTime() - b.getTime())
      .at(0) ?? null

  return { rows, lines, liveDots, earliestAt, formatTick: tickFormatter(range.granularity) }
}
