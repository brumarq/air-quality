import type { No2Limits } from "@/domain/limits"

/** One annual mean from a passive-tube campaign. */
export interface No2Reading {
  year: number
  value: number
}

/** The campaign report a year's values come from. */
export interface No2Source {
  year: number
  title: string
  url: string
  page: number
}

export interface No2Tube {
  id: string
  name: string
  note?: string
  tubeIds: string[]
  lat: number
  lng: number
  approximateLocation: boolean
  /** Only years with a value, oldest first. */
  readings: No2Reading[]
}

export interface No2TubeDataset {
  commune: string
  unit: string
  method: string
  /** Every year the campaign published a report, oldest first. A tube may have no
   *  reading in some of them (e.g. it was installed later). */
  campaignYears: number[]
  sources: No2Source[]
  tubes: No2Tube[]
}

export function getLatestReading(tube: No2Tube): No2Reading | null {
  return tube.readings.at(-1) ?? null
}

export function getReading(tube: No2Tube, year: number): number | null {
  return tube.readings.find((r) => r.year === year)?.value ?? null
}

export type ReductionNeeded =
  | { status: "no-data"; tubeId: string; name: string }
  | {
      status: "ok"
      tubeId: string
      name: string
      latestYear: number
      latestValue: number
      /** How far the latest value is above (+) or below (−) the target, in percent. */
      pctVsTarget: number
      /** The yearly reduction that reaches the target by the target year; null when the
       *  tube is already at or below it, or the target year has passed. */
      neededPerYear: number | null
      /** Latest value minus the previous calendar year's; null if that year has no reading. */
      changeVsPreviousYear: number | null
    }

/**
 * The per-year reduction each site needs to reach the target by the target year, plus its
 * change from the previous calendar year. Deliberately not a fitted trend line: with 5-8
 * noisy annual points per tube, a fitted slope would claim more certainty than the data has.
 */
export function getReductionNeeded(dataset: No2TubeDataset, limits: No2Limits): ReductionNeeded[] {
  return dataset.tubes.map((tube) => {
    const latest = getLatestReading(tube)
    if (!latest) return { status: "no-data", tubeId: tube.id, name: tube.name }

    const { year: latestYear, value: latestValue } = latest
    const target = limits.limitTarget
    const yearsRemaining = limits.targetYear - latestYear
    const previous = getReading(tube, latestYear - 1)

    return {
      status: "ok",
      tubeId: tube.id,
      name: tube.name,
      latestYear,
      latestValue,
      pctVsTarget: ((latestValue - target) / target) * 100,
      neededPerYear: latestValue <= target || yearsRemaining <= 0 ? null : (latestValue - target) / yearsRemaining,
      changeVsPreviousYear: previous === null ? null : latestValue - previous,
    }
  })
}

export type No2Band = "above-limit" | "above-2030" | "above-who" | "within-who"

// Matches the official Pacte Climat report's own classification (e.g. 2023 report fig. 3):
// red above today's limit, orange/yellow above the 2030 value, green above the WHO
// guideline, blue at or below it.
export function classifyNo2(value: number, limits: No2Limits): No2Band {
  if (value > limits.limitToday) return "above-limit"
  if (value > limits.limitTarget) return "above-2030"
  if (value > limits.whoGuideline) return "above-who"
  return "within-who"
}
