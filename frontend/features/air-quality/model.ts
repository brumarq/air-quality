import { getLimitStatus, type LimitStatus, type PollutantLimit } from "@/shared/domain/limits"
import type { Granularity, TimeWindow } from "./time"
import { tokens } from "@/shared/theme/tokens"

export interface Location {
  id: number
  name: string
  latitude: number
  longitude: number
}

export interface Sensor {
  id: number
  sensorId: number
  parameter: string
  unit?: string
}

export interface Reading {
  at: Date
  value: number
  unit: string
}

export interface AirQualityStation {
  id: number
  name: string
  lat: number
  lng: number
  sensors: Sensor[]
}

export interface StationHistory {
  station: AirQualityStation
  points: Reading[]
}

export interface SensorHistory {
  window: TimeWindow
  stations: StationHistory[]
}

export type SummaryMode = "latest" | "average"

export type StationSummary =
  | { status: "no-data"; droppedOtherUnit: number }
  | {
      status: "ok"
      value: number
      count: number
      latestAt: Date
      limitStatus: LimitStatus
      droppedOtherUnit: number
    }

export function summarizeStation(points: Reading[], limit: PollutantLimit, mode: SummaryMode): StationSummary {
  const comparable = points.filter((p) => p.unit === limit.unit)
  const droppedOtherUnit = points.length - comparable.length
  const latest = comparable.at(-1)
  if (!latest) return { status: "no-data", droppedOtherUnit }

  const value = mode === "latest" ? latest.value : comparable.reduce((sum, p) => sum + p.value, 0) / comparable.length
  return {
    status: "ok",
    value,
    count: comparable.length,
    latestAt: latest.at,
    limitStatus: getLimitStatus(value, limit),
    droppedOtherUnit,
  }
}

export function stationColor(stationIndex: number): string {
  return tokens.station[stationIndex % tokens.station.length] ?? tokens.station[0]
}

export const RANGE_KEYS = ["live", "day", "week", "month", "year"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]

export interface TimeRangeOption {
  key: RangeKey
  label: string
  days: number
  live: boolean
  chip: string
  granularity: Granularity
  footnote: string
}

const SHORT_PERIOD_FOOTNOTE = "EU limits are annual means. Averages over shorter periods are indicative only."

export const TIME_RANGES: Record<RangeKey, TimeRangeOption> = {
  live: {
    key: "live", label: "Live", days: 1, live: true, chip: "Live", granularity: "hour",
    footnote: "Single hourly values. EU limits are annual means, so this is indicative only.",
  },
  day: {
    key: "day", label: "Day", days: 1, live: false, chip: "24-hour average", granularity: "hour",
    footnote: SHORT_PERIOD_FOOTNOTE,
  },
  week: {
    key: "week", label: "Week", days: 7, live: false, chip: "7-day average", granularity: "day",
    footnote: SHORT_PERIOD_FOOTNOTE,
  },
  month: {
    key: "month", label: "Month", days: 30, live: false, chip: "30-day average", granularity: "day",
    footnote: SHORT_PERIOD_FOOTNOTE,
  },
  year: {
    key: "year", label: "Year", days: 365, live: false, chip: "12-month average", granularity: "month",
    footnote: "EU limits are annual means, judged per calendar year. A rolling 12-month mean is indicative.",
  },
}

export function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEYS.some((key) => key === value)
}
