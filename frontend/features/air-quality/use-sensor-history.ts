"use client"

import { AirQualityApi } from "@/api/air-quality"
import type { AirQualityStation, StationHistory } from "@/domain/air-quality"
import type { PollutantLimit } from "@/domain/limits"
import { windowEndingAt, type TimeWindow } from "@/domain/shared/time"
import { useAsync, type AsyncState } from "@/lib/use-async"

export interface SensorHistory {
  /** The window the readings were fetched for; the chart's axis must use the same one. */
  window: TimeWindow
  stations: StationHistory[]
}

/**
 * One pollutant's readings for every station over a rolling window ending now. Shared by
 * the station bars (which summarise it) and the trend chart (which plots it). Pass
 * `stations: null` to skip loading (e.g. while another mode is shown).
 */
export function useSensorHistory(
  stations: AirQualityStation[] | null,
  limit: PollutantLimit,
  days: number,
): AsyncState<SensorHistory> {
  const key = stations && `${stations.map((s) => s.id).join(",")}|${limit.parameter}|${days}`

  return useAsync(key, async (signal) => {
    const window = windowEndingAt(new Date(), days)
    const history = await Promise.all(
      (stations ?? []).map(async (station): Promise<StationHistory> => {
        const sensor = station.sensors?.find((s) => s.parameter === limit.parameter)
        if (!sensor) return { station, points: [] }
        return { station, points: await AirQualityApi.getSensorReadingHistory(sensor.sensorId, window.from, window.to, signal) }
      }),
    )
    return { window, stations: history }
  })
}
