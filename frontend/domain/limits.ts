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

/** The NO2 values the tube campaign is read against, in µg/m³ (annual means). */
export interface No2Limits {
  limitToday: number
  limitTarget: number
  targetYear: number
  whoGuideline: number
}

export const NO2_LIMITS: No2Limits = {
  limitToday: POLLUTANT_LIMITS.no2.limitToday,
  limitTarget: POLLUTANT_LIMITS.no2.limit2030,
  targetYear: 2030,
  // WHO 2021 air quality guideline for the annual NO2 mean.
  whoGuideline: 10,
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

export const LIMIT_STATUS_ORDER: LimitStatus[] = ["below-2030", "above-2030", "above-today"]
