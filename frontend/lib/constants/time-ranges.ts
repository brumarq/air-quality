export interface TimeRangeOption {
  key: string
  label: string
  days: number
  // Live uses the same 1-day window as "Day", but bars show the latest point instead of
  // an average, and the trend chart marks the latest point instead of just plotting a line.
  live: boolean
  // Short chip text for the "Air quality" card header (e.g. "24-hour average").
  chip: string
}

// Each window is rolling, ending now (e.g. "day" = last 24h, not "since midnight"), kept
// consistent across options rather than mixing calendar-aligned and rolling windows.
export const TIME_RANGES: TimeRangeOption[] = [
  { key: "live", label: "Live", days: 1, live: true, chip: "Live" },
  { key: "day", label: "Day", days: 1, live: false, chip: "24-hour average" },
  { key: "week", label: "Week", days: 7, live: false, chip: "7-day average" },
  { key: "month", label: "Month", days: 30, live: false, chip: "30-day average" },
  { key: "year", label: "Year", days: 365, live: false, chip: "12-month average" },
]
