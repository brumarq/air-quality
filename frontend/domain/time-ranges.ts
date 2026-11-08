import type { Granularity } from "@/domain/time"

/** The periods the header offers, in display order. Adding one here makes the compiler
 *  flag every place that must handle it. */
export const RANGE_KEYS = ["live", "day", "week", "month", "year"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]

export interface TimeRangeOption {
  key: RangeKey
  label: string
  days: number
  // Live uses the same 1-day window as "Day", but bars show the latest point instead of
  // an average, and the trend chart marks the latest point instead of just plotting a line.
  live: boolean
  // Short chip text for the "Air quality" card header (e.g. "24-hour average").
  chip: string
  // How the trend chart groups readings for this period.
  granularity: Granularity
}

// Each window is rolling, ending now (e.g. "day" = last 24h, not "since midnight"), kept
// consistent across options rather than mixing calendar-aligned and rolling windows.
export const TIME_RANGES: Record<RangeKey, TimeRangeOption> = {
  live: { key: "live", label: "Live", days: 1, live: true, chip: "Live", granularity: "hour" },
  day: { key: "day", label: "Day", days: 1, live: false, chip: "24-hour average", granularity: "hour" },
  week: { key: "week", label: "Week", days: 7, live: false, chip: "7-day average", granularity: "eightHour" },
  month: { key: "month", label: "Month", days: 30, live: false, chip: "30-day average", granularity: "day" },
  year: { key: "year", label: "Year", days: 365, live: false, chip: "12-month average", granularity: "month" },
}

export function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEYS.some((key) => key === value)
}
