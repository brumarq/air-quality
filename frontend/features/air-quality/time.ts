import { tz } from "@date-fns/tz"
import { eachDayOfInterval, eachHourOfInterval, eachMonthOfInterval } from "date-fns"
import type { StationHistory } from "./model"

export const LUXEMBOURG_TIME_ZONE = "Europe/Luxembourg"

const IN_UTC = { in: tz("UTC") }
const IN_LUXEMBOURG = { in: tz(LUXEMBOURG_TIME_ZONE) }
const DAY_MS = 24 * 60 * 60 * 1000

export type Granularity = "hour" | "day" | "month"

export interface TimeWindow {
  from: Date
  to: Date
}

const instant = (date: Date) => new Date(date.getTime())

export function bucketAxis(granularity: Granularity, window: TimeWindow): Date[] {
  const interval = { start: window.from, end: window.to }
  switch (granularity) {
    case "hour":
      return eachHourOfInterval(interval, IN_UTC).map(instant)
    case "day":
      return eachDayOfInterval(interval, IN_LUXEMBOURG).map(instant)
    case "month":
      return eachMonthOfInterval(interval, IN_LUXEMBOURG).map(instant)
  }
}

export function windowEndingAt(now: Date, days: number): TimeWindow {
  return { from: new Date(now.getTime() - days * DAY_MS), to: now }
}

export interface TrendSeries {
  stationId: number
  points: (number | null)[]
}

export interface TrendBuckets {
  axis: Date[]
  series: TrendSeries[]
}

export function bucketTrend(history: StationHistory[], unit: string, granularity: Granularity, window: TimeWindow): TrendBuckets {
  const axis = bucketAxis(granularity, window)

  const series = history.map(({ station, points }) => {
    const totals = axis.map(() => ({ sum: 0, count: 0 }))
    for (const point of points) {
      if (point.unit !== unit || point.at > window.to) continue
      const total = totals[axis.findLastIndex((start) => start <= point.at)]
      if (!total) continue
      total.sum += point.value
      total.count += 1
    }
    return { stationId: station.id, points: totals.map(({ sum, count }) => (count === 0 ? null : sum / count)) }
  })

  return { axis, series }
}
