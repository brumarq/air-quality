import type { StationHistory } from "@/domain/air-quality"
import { bucketAxis, bucketStart, type Granularity, type TimeWindow } from "@/domain/shared/time"

/** One station's averages, aligned with `axis`: null where the station had no reading. */
export interface TrendSeries {
  stationId: number
  points: (number | null)[]
}

export interface TrendBuckets {
  /** Every bucket start in the window, gaps included, so the chart's x axis is even. */
  axis: Date[]
  series: TrendSeries[]
}

/**
 * Averages each station's readings per bucket of `granularity` across `window`. The
 * readings endpoint returns one value per hour, so hourly buckets hold one reading each
 * and coarser ones average several. Readings outside the window are left out.
 */
export function bucketTrend(history: StationHistory[], granularity: Granularity, window: TimeWindow): TrendBuckets {
  const axis = bucketAxis(granularity, window)
  const indexByStart = new Map(axis.map((start, i) => [start.getTime(), i]))

  const series = history.map(({ station, points }) => {
    const totals = axis.map(() => ({ sum: 0, count: 0 }))
    for (const point of points) {
      const index = indexByStart.get(bucketStart(granularity, point.at).getTime())
      const total = index === undefined ? undefined : totals[index]
      if (!total) continue
      total.sum += point.value
      total.count += 1
    }
    return { stationId: station.id, points: totals.map(({ sum, count }) => (count === 0 ? null : sum / count)) }
  })

  return { axis, series }
}
