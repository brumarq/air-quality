// Time bucketing in Luxembourg time. Every function takes and returns absolute instants
// (Date) and gives the same answer on any machine, whatever its own time zone.

import { TZDate } from "@date-fns/tz"
import { addDays, addMonths, set, startOfDay, startOfMonth } from "date-fns"

export const LUXEMBOURG_TIME_ZONE = "Europe/Luxembourg"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export type Granularity = "hour" | "eightHour" | "day" | "month"

/** A time window; both ends are included. */
export interface TimeWindow {
  from: Date
  to: Date
}

interface BucketStrategy {
  /** The start of the bucket that contains `at`. */
  start: (at: Date) => Date
  /** The start of the bucket after the one starting at `start`. */
  next: (start: Date) => Date
}

const inLuxembourg = (at: Date) => new TZDate(at.getTime(), LUXEMBOURG_TIME_ZONE)
const instant = (date: Date) => new Date(date.getTime())

const EIGHT_HOUR_BLOCK_STARTS = [0, 8, 16] as const

const STRATEGIES = {
  // Luxembourg's UTC offsets are whole hours, so local hours start exactly on UTC hours.
  // Plain arithmetic keeps the repeated hour on the autumn DST night as its own bucket;
  // zone-aware startOfHour folds 00:xxZ and 01:xxZ into one.
  hour: {
    start: (at) => new Date(Math.floor(at.getTime() / HOUR_MS) * HOUR_MS),
    next: (start) => new Date(start.getTime() + HOUR_MS),
  },
  // Blocks start at 00:00, 08:00 and 16:00 local time. On DST days one block is 7 or 9 hours.
  eightHour: {
    start: (at) => {
      const local = inLuxembourg(at)
      const hours = Math.floor(local.getHours() / 8) * 8
      return instant(set(local, { hours, minutes: 0, seconds: 0, milliseconds: 0 }))
    },
    next: (start) => {
      const local = inLuxembourg(start)
      const nextHours = EIGHT_HOUR_BLOCK_STARTS.find((h) => h > local.getHours())
      return instant(nextHours === undefined ? startOfDay(addDays(local, 1)) : set(local, { hours: nextHours }))
    },
  },
  day: {
    start: (at) => instant(startOfDay(inLuxembourg(at))),
    next: (start) => instant(addDays(inLuxembourg(start), 1)),
  },
  month: {
    start: (at) => instant(startOfMonth(inLuxembourg(at))),
    next: (start) => instant(addMonths(inLuxembourg(start), 1)),
  },
} satisfies Record<Granularity, BucketStrategy>

export function bucketStart(granularity: Granularity, at: Date): Date {
  return STRATEGIES[granularity].start(at)
}

export function nextBucket(granularity: Granularity, start: Date): Date {
  return STRATEGIES[granularity].next(start)
}

/** Every bucket start from the bucket containing `window.from` up to `window.to`. */
export function bucketAxis(granularity: Granularity, window: TimeWindow): Date[] {
  const axis: Date[] = []
  for (let cursor = bucketStart(granularity, window.from); cursor <= window.to; cursor = nextBucket(granularity, cursor)) {
    axis.push(cursor)
  }
  return axis
}

/** The rolling window of `days` days that ends at `now`. */
export function windowEndingAt(now: Date, days: number): TimeWindow {
  return { from: new Date(now.getTime() - days * DAY_MS), to: now }
}
