import type { StationHistory } from "@/hooks/use-sensor-history"

export type ChartRow = { timestamp: string } & Record<string, number | string>

interface BucketStrategy {
  // Rounds a timestamp down to the start of its bucket.
  bucketStart: (date: Date) => Date
  // Advances a bucket start to the next one (handles variable-length months).
  next: (date: Date) => Date
  // X-axis tick label for a bucket start.
  formatTick: (date: Date) => string
}

const STRATEGIES: Record<string, BucketStrategy> = {
  // live/day: no bucketing, one point per raw (already-hourly) reading.
  hourly: {
    bucketStart: (d) => {
      const r = new Date(d)
      r.setMinutes(0, 0, 0)
      return r
    },
    next: (d) => {
      const r = new Date(d)
      r.setHours(r.getHours() + 1)
      return r
    },
    formatTick: (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  },
  // week: 3 buckets/day (8h blocks).
  eightHourly: {
    bucketStart: (d) => {
      const r = new Date(d)
      r.setHours(Math.floor(r.getHours() / 8) * 8, 0, 0, 0)
      return r
    },
    next: (d) => {
      const r = new Date(d)
      r.setHours(r.getHours() + 8)
      return r
    },
    formatTick: (d) => d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
  },
  // month: one bucket/day.
  daily: {
    bucketStart: (d) => {
      const r = new Date(d)
      r.setHours(0, 0, 0, 0)
      return r
    },
    next: (d) => {
      const r = new Date(d)
      r.setDate(r.getDate() + 1)
      return r
    },
    formatTick: (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  },
  // year: one bucket/month.
  monthly: {
    bucketStart: (d) => {
      const r = new Date(d)
      r.setDate(1)
      r.setHours(0, 0, 0, 0)
      return r
    },
    next: (d) => {
      const r = new Date(d)
      r.setMonth(r.getMonth() + 1)
      return r
    },
    formatTick: (d) => d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
  },
}

function strategyForRange(rangeKey: string): BucketStrategy {
  switch (rangeKey) {
    case "week":
      return STRATEGIES.eightHourly
    case "month":
      return STRATEGIES.daily
    case "year":
      return STRATEGIES.monthly
    default: // "live" and "day"
      return STRATEGIES.hourly
  }
}

/**
 * Buckets each station's raw points to match the selected range's granularity, averaging
 * within each bucket, and fills in every expected bucket across [from, to] - even ones with
 * no data for any station - so gaps render as real gaps against a consistent, evenly spaced axis.
 */
export function bucketTrendData(
  history: StationHistory[],
  rangeKey: string,
  from: Date,
  to: Date
): { rows: ChartRow[]; formatTick: (timestamp: string) => string } {
  const strategy = strategyForRange(rangeKey)

  const rows = new Map<string, ChartRow>()
  for (let cursor = strategy.bucketStart(from); cursor <= to; cursor = strategy.next(cursor)) {
    rows.set(cursor.toISOString(), { timestamp: cursor.toISOString() })
  }

  for (const { station, points } of history) {
    const buckets = new Map<string, { sum: number; count: number }>()
    for (const point of points) {
      const key = strategy.bucketStart(new Date(point.timestamp)).toISOString()
      const entry = buckets.get(key) ?? { sum: 0, count: 0 }
      entry.sum += point.value
      entry.count += 1
      buckets.set(key, entry)
    }
    for (const [key, { sum, count }] of buckets) {
      const row = rows.get(key)
      if (row) row[station.name] = sum / count
    }
  }

  return {
    rows: Array.from(rows.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    formatTick: (timestamp: string) => strategy.formatTick(new Date(timestamp)),
  }
}
