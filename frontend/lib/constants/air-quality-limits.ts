export interface PollutantLimit {
  parameter: string
  label: string
  unit: string
  limitToday: number
  limit2030: number
}

// limit2030 values come from market research (Directive 2024/2881); limitToday values
// are from memory and still need a check against the Directive 2008/50/EC text (see
// ESCH-HEAT-PROFILE-PLAN.md) before these are shown to anyone outside the team.
export const POLLUTANT_LIMITS: PollutantLimit[] = [
  { parameter: "no2", label: "NO₂", unit: "µg/m³", limitToday: 40, limit2030: 20 },
  { parameter: "pm25", label: "PM2.5", unit: "µg/m³", limitToday: 25, limit2030: 10 },
  { parameter: "pm10", label: "PM10", unit: "µg/m³", limitToday: 40, limit2030: 20 },
]

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
  "below-2030": "hsl(var(--chart-2))",
  "above-2030": "hsl(var(--chart-4))",
  "above-today": "hsl(var(--destructive))",
}

export const LIMIT_STATUS_ORDER: LimitStatus[] = ["below-2030", "above-2030", "above-today"]
