import eschTubes from "@/data/no2-tubes/esch.json"

export interface NO2TubeSource {
  title: string
  url: string
  page: number
}

export interface NO2Tube {
  id: string
  name: string
  note?: string
  tubeIds: string[]
  lat: number
  lng: number
  approximateLocation: boolean
  readings: Record<string, number | null>
}

export interface NO2TubeDataset {
  commune: string
  pollutant: string
  unit: string
  limitToday: number
  limit2030: number
  method: string
  sources: Record<string, NO2TubeSource>
  tubes: NO2Tube[]
}

const DATASETS: Record<string, NO2TubeDataset> = {
  "esch-sur-alzette": eschTubes as NO2TubeDataset,
}

export function getNo2TubeDataset(communeSlug: string): NO2TubeDataset | null {
  return DATASETS[communeSlug] ?? null
}

export function getTubeYears(dataset: NO2TubeDataset): number[] {
  return Object.keys(dataset.sources).map(Number).sort((a, b) => a - b)
}

export function getLatestReading(tube: NO2Tube, years: number[]): { year: number; value: number } | null {
  for (let i = years.length - 1; i >= 0; i--) {
    const value = tube.readings[String(years[i])]
    if (value !== null && value !== undefined) return { year: years[i], value }
  }
  return null
}

export interface ReductionNeeded {
  tubeId: string
  name: string
  latestYear: number
  latestValue: number
  pctVsTarget: number
  neededPerYear: number | null
  lastYearChange: number | null
}

/**
 * The per-year reduction a site needs to reach limit2030 by 2030, plus its most recent
 * year-over-year change. Deliberately not a fitted trend line through 5-8 noisy points -
 * see ESCH-HEAT-PROFILE-PLAN.md Step 2.5 for why.
 */
export function getReductionNeeded(dataset: NO2TubeDataset, targetYear = 2030): ReductionNeeded[] {
  const years = getTubeYears(dataset)

  return dataset.tubes.map((tube) => {
    const latest = getLatestReading(tube, years)
    if (!latest) {
      return {
        tubeId: tube.id,
        name: tube.name,
        latestYear: years[years.length - 1],
        latestValue: NaN,
        pctVsTarget: NaN,
        neededPerYear: null,
        lastYearChange: null,
      }
    }

    const { year: latestYear, value: latestValue } = latest
    const pctVsTarget = ((latestValue - dataset.limit2030) / dataset.limit2030) * 100
    const yearsRemaining = targetYear - latestYear
    const neededPerYear =
      latestValue <= dataset.limit2030 || yearsRemaining <= 0
        ? null
        : (latestValue - dataset.limit2030) / yearsRemaining

    const priorYear = years[years.indexOf(latestYear) - 1]
    const priorValue = priorYear !== undefined ? tube.readings[String(priorYear)] : null
    const lastYearChange =
      priorValue !== null && priorValue !== undefined ? Number((latestValue - priorValue).toFixed(1)) : null

    return { tubeId: tube.id, name: tube.name, latestYear, latestValue, pctVsTarget, neededPerYear, lastYearChange }
  })
}

// Matches the official Pacte Climat report's own classification (e.g. 2023 report fig. 3):
// red above today's limit, orange/yellow above the 2030 value, green above the WHO
// guideline, blue at or below it.
export function getTubeColor(value: number, dataset: NO2TubeDataset): string {
  if (value > dataset.limitToday) return "#DC2626" // red
  if (value > dataset.limit2030) return "#F59E0B" // orange/yellow
  if (value > 10) return "#22C55E" // green
  return "#3B82F6" // blue
}
