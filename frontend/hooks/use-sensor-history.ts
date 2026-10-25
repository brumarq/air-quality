"use client"

import { useEffect, useState } from "react"
import { AirQualityApi } from "@/lib/api/air-quality"
import type { AirQualityStation, SensorReadingHistoryPoint } from "@/lib/types/air-quality"
import type { PollutantLimit } from "@/lib/constants/air-quality-limits"

export interface StationHistory {
  station: AirQualityStation
  points: SensorReadingHistoryPoint[]
}

/**
 * Fetches one pollutant's history for every station over a rolling window ending now.
 * Shared by the per-station bars (which average it) and the trend chart (which plots it raw).
 */
export function useSensorHistory(
  stations: AirQualityStation[],
  limit: PollutantLimit,
  days: number
): StationHistory[] | null {
  const [history, setHistory] = useState<StationHistory[] | null>(null)

  // Depend on primitives derived from stations/limit rather than their object/array
  // identity - a parent re-render that happens to pass a structurally-equal but newly
  // created array/object must not look like a real change and re-trigger this fetch
  // (this exact bug has bitten this hook before: "Maximum update depth exceeded").
  const stationsKey = stations.map((s) => s.id).join(",")

  useEffect(() => {
    let cancelled = false
    setHistory(null)

    async function fetchHistory() {
      const to = new Date()
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

      const result = await Promise.all(
        stations.map(async (station): Promise<StationHistory> => {
          const sensor = station.sensors?.find((s) => s.parameter === limit.parameter)
          if (!sensor) return { station, points: [] }
          const points = await AirQualityApi.getSensorReadingHistory(sensor.sensorId, from, to)
          return { station, points }
        })
      )

      if (!cancelled) setHistory(result)
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationsKey, limit.parameter, days])

  return history
}
