import { NO2_TARGET_YEAR, POLLUTANT_LIMITS, WHO_NO2_GUIDELINE } from "@/shared/domain/limits"
import { tokens } from "@/shared/theme/tokens"

export interface No2Reading {
  year: number
  value: number
}

export interface No2Tube {
  id: string
  name: string
  lat: number
  lng: number
  approximateLocation: boolean
  readings: No2Reading[]
}

export interface No2TubeDataset {
  campaignYears: number[]
  tubes: No2Tube[]
}

export function getLatestReading(tube: No2Tube): No2Reading | null {
  return tube.readings.at(-1) ?? null
}

export function getReading(tube: No2Tube, year: number): number | null {
  return tube.readings.find((r) => r.year === year)?.value ?? null
}

export type Reduction = { kind: "at-or-below" } | { kind: "deadline-reached" } | { kind: "needed"; perYear: number }

export type ReductionNeeded =
  | { status: "no-data"; tubeId: string; name: string }
  | {
      status: "ok"
      tubeId: string
      name: string
      latestYear: number
      latestValue: number
      pctVsTarget: number
      reduction: Reduction
      changeVsPreviousYear: number | null
    }

export function getReductionNeeded(dataset: No2TubeDataset): ReductionNeeded[] {
  return dataset.tubes.map((tube) => {
    const latest = getLatestReading(tube)
    if (!latest) return { status: "no-data", tubeId: tube.id, name: tube.name }

    const { year: latestYear, value: latestValue } = latest
    const target = POLLUTANT_LIMITS.no2.limit2030
    const yearsRemaining = NO2_TARGET_YEAR - latestYear
    const previous = getReading(tube, latestYear - 1)

    return {
      status: "ok",
      tubeId: tube.id,
      name: tube.name,
      latestYear,
      latestValue,
      pctVsTarget: ((latestValue - target) / target) * 100,
      reduction:
        latestValue <= target
          ? { kind: "at-or-below" }
          : yearsRemaining <= 0
            ? { kind: "deadline-reached" }
            : { kind: "needed", perYear: (latestValue - target) / yearsRemaining },
      changeVsPreviousYear: previous === null ? null : latestValue - previous,
    }
  })
}

export type No2Band = "above-limit" | "above-2030" | "above-who" | "within-who"

export function classifyNo2(value: number): No2Band {
  if (value > POLLUTANT_LIMITS.no2.limitToday) return "above-limit"
  if (value > POLLUTANT_LIMITS.no2.limit2030) return "above-2030"
  if (value > WHO_NO2_GUIDELINE) return "above-who"
  return "within-who"
}

export const NO2_BAND_COLOR: Record<No2Band, string> = {
  "above-limit": tokens.no2.band.aboveLimit,
  "above-2030": tokens.no2.band.above2030,
  "above-who": tokens.no2.band.aboveWho,
  "within-who": tokens.no2.band.withinWho,
}
