import { getLimitStatus, type LimitStatus, type PollutantLimit } from "@/domain/limits"

export interface Location {
  id: number
  name: string
  city?: string
  country: string
  latitude: number
  longitude: number
}

export interface Sensor {
  id: number
  sensorId: number
  parameter: string
  unit?: string
  lastValue?: number
  lastUpdated?: Date
  locationId?: number
}

/** One measurement. `at` is an absolute instant; api/ converts the backend's zoneless UTC strings. */
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
  sensors?: Sensor[]
}

export interface StationHistory {
  station: AirQualityStation
  /** Oldest first. */
  points: Reading[]
}

export type SummaryMode = "latest" | "average"

export type StationSummary =
  | { status: "no-data"; droppedOtherUnit: number }
  | {
      status: "ok"
      /** The latest reading, or the mean of all readings, depending on the mode. */
      value: number
      /** How many readings went into `value`'s period. */
      count: number
      latestAt: Date
      limitStatus: LimitStatus
      /** Readings left out because their unit isn't the limit's unit. */
      droppedOtherUnit: number
    }

/**
 * One station's readings for a pollutant, summarised against its limit. Readings in a
 * unit other than the limit's can't be compared, so they're left out and counted.
 */
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
