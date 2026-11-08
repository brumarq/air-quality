/** The pollutants the app compares against EU limits, in display order. */
export const POLLUTANT_PARAMETERS = ["no2", "pm25", "pm10"] as const
export type PollutantParameter = (typeof POLLUTANT_PARAMETERS)[number]

export interface PollutantLimit {
  parameter: PollutantParameter
  label: string
  unit: string
  limitToday: number
  limit2030: number
}

// limit2030 values come from market research (Directive 2024/2881); limitToday values
// are from memory and still need a check against the Directive 2008/50/EC text (see
// ESCH-HEAT-PROFILE-PLAN.md) before these are shown to anyone outside the team.
export const POLLUTANT_LIMITS: Record<PollutantParameter, PollutantLimit> = {
  no2: { parameter: "no2", label: "NO₂", unit: "µg/m³", limitToday: 40, limit2030: 20 },
  pm25: { parameter: "pm25", label: "PM2.5", unit: "µg/m³", limitToday: 25, limit2030: 10 },
  pm10: { parameter: "pm10", label: "PM10", unit: "µg/m³", limitToday: 40, limit2030: 20 },
}

export type LimitStatus = "below-2030" | "above-2030" | "above-today"

export function getLimitStatus(value: number, limit: PollutantLimit): LimitStatus {
  if (value > limit.limitToday) return "above-today"
  if (value > limit.limit2030) return "above-2030"
  return "below-2030"
}

export const LIMIT_STATUS_LABEL: Record<LimitStatus, string> = {
  "below-2030": "Below 2030 limit",
  "above-2030": "Above 2030 limit",
  "above-today": "Above today's limit",
}

export const LIMIT_STATUS_COLOR: Record<LimitStatus, string> = {
  "below-2030": "#14B8A6",
  "above-2030": "#FBBF24",
  "above-today": "#F97316",
}

export const LIMIT_STATUS_RING: Record<LimitStatus, string> = {
  "below-2030": "#0F766E",
  "above-2030": "#B45309",
  "above-today": "#C2410C",
}

export const LIMIT_STATUS_ORDER: LimitStatus[] = ["below-2030", "above-2030", "above-today"]

export const LIMIT_TODAY_COLOR = "#525252"
export const LIMIT_2030_COLOR = "#B91C1C"

// One color per station, assigned by index into a commune's/the Luxembourg view's station
// list - same index everywhere (readings panel, trend chart, map) means the same station
// always gets the same color. Cool hues only: warm ones (green/amber/orange/red/gray) are
// reserved for the limit-status bands and reference lines, so a station color never looks
// like it's signaling compliance status.
export const STATION_COLORS = [
  "#0D9488", // teal - Esch/Alzette (from the original design spec)
  "#3730A3", // indigo - Esch Gare (from the original design spec)
  "#2563EB", // blue
  "#7C3AED", // violet
  "#C026D3", // fuchsia
  "#DB2777", // pink
  "#E11D48", // rose
  "#0284C7", // sky
  "#0E7490", // cyan
]
