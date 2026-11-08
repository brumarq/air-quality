"use client"

import { useState } from "react"
import type mapboxgl from "mapbox-gl"
import { useNo2TubeMarkers } from "@/features/no2-tubes"
import { useSensorHistory, type SensorHistory } from "@/features/air-quality"
import type { AirQualityStation } from "@/domain/air-quality"
import { TIME_RANGES, type RangeKey } from "@/domain/air-quality/time-ranges"
import { NO2_LIMITS, POLLUTANT_LIMITS, type PollutantParameter } from "@/domain/limits"
import type { AsyncState } from "@/lib/use-async"
import type { AreaTubes } from "./use-area-tubes"

interface UseAirModeProps {
  map: mapboxgl.Map | null
  stations: AsyncState<AirQualityStation[]>
  tubes: AreaTubes
  active: boolean
}

/** Air-quality mode's state: the chosen pollutant and period, the readings, and the tube pins. */
export function useAirMode({ map, stations, tubes, active }: UseAirModeProps) {
  const [parameter, setParameter] = useState<PollutantParameter>("no2")
  const [rangeKey, setRangeKey] = useState<RangeKey>("live")
  const limit = POLLUTANT_LIMITS[parameter]
  const range = TIME_RANGES[rangeKey]

  const history = useSensorHistory(active && stations.status === "ready" ? stations.data : null, limit, range.days)
  // No readings without the station list; its failure is the readings' failure.
  const readings: AsyncState<SensorHistory> = stations.status === "error" ? stations : history

  const tubeMarkers = useNo2TubeMarkers({
    map,
    dataset: tubes.status === "ready" ? tubes.dataset : null,
    limits: NO2_LIMITS,
    visible: active,
  })

  return { parameter, setParameter, limit, rangeKey, setRangeKey, range, readings, ...tubeMarkers }
}
