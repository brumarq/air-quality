"use client"

import { useState } from "react"
import { type AirQualityStation, type RangeKey, type SensorHistory, type StationHistory, TIME_RANGES } from "./model"
import { windowEndingAt } from "./time"
import { POLLUTANT_LIMITS, type PollutantParameter, type PollutantLimit } from "@/shared/domain/limits"
import { type AsyncState, useAsync } from "@/shared/lib/use-async"
import { AirQualityApi } from "./api"

export function useAirQualityMode({ stations, active }: { stations: AsyncState<AirQualityStation[]>; active: boolean }) {
  const [parameter, setParameter] = useState<PollutantParameter>("no2")
  const [rangeKey, setRangeKey] = useState<RangeKey>("live")
  const limit = POLLUTANT_LIMITS[parameter]
  const range = TIME_RANGES[rangeKey]

  const history = useSensorHistory(active && stations.status === "ready" ? stations.data : null, limit, range.days)
  const readings: AsyncState<SensorHistory> = stations.status === "error" ? stations : history

  return { parameter, setParameter, limit, rangeKey, setRangeKey, range, readings }
}

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
        const sensor = station.sensors.find((s) => s.parameter === limit.parameter)
        if (!sensor) return { station, points: [] }
        return { station, points: await AirQualityApi.getSensorReadingHistory(sensor.sensorId, window.from, window.to, signal) }
      }),
    )
    return { window, stations: history }
  })
}
