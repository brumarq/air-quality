export interface TimeRangeOption {
  key: string
  label: string
  days: number
  // Live uses the same 1-day window as "Day", but bars show the latest point instead of
  // an average, and the trend chart marks the latest point instead of just plotting a line.
  live: boolean
}

// Each window is rolling, ending now (e.g. "day" = last 24h, not "since midnight"), kept
// consistent across options rather than mixing calendar-aligned and rolling windows.
export const TIME_RANGES: TimeRangeOption[] = [
  { key: "live", label: "Live", days: 1, live: true },
  { key: "day", label: "Day", days: 1, live: false },
  { key: "week", label: "Week", days: 7, live: false },
  { key: "month", label: "Month", days: 30, live: false },
  { key: "year", label: "Year", days: 365, live: false },
]
