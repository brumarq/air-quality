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
  }, [stations, limit, days])

  return history
}
