import type { No2Limits } from "@/domain/limits"
import { getReductionNeeded, type No2TubeDataset } from "@/domain/no2-tubes"
import { formatOneDecimal, formatSigned } from "./format"

export interface ReductionTableRow {
  tubeId: string
  name: string
  /** The latest value, with its year when the header can't name one shared year. */
  value: string
  valueYear: number | null
  vsTarget: string | null
  aboveTarget: boolean
  neededPerYear: string
  changeVsPreviousYear: string
}

export interface ReductionTableModel {
  title: string
  /** The year above the value column: the one year every row's value is from, or "Latest". */
  valueHeader: string
  rows: ReductionTableRow[]
}

const DASH = "—"

/** What the NO2 reduction card shows; all rounding happens here. */
export function buildReductionTable(dataset: No2TubeDataset, limits: No2Limits): ReductionTableModel {
  const reductions = getReductionNeeded(dataset, limits)
  const years = new Set(reductions.flatMap((r) => (r.status === "ok" ? [r.latestYear] : [])))
  const sharedYear = years.size === 1 ? [...years][0] : undefined

  const rows = reductions.map((r): ReductionTableRow => {
    if (r.status === "no-data") {
      return {
        tubeId: r.tubeId,
        name: r.name,
        value: "No reading",
        valueYear: null,
        vsTarget: null,
        aboveTarget: false,
        neededPerYear: DASH,
        changeVsPreviousYear: DASH,
      }
    }
    return {
      tubeId: r.tubeId,
      name: r.name,
      value: formatOneDecimal(r.latestValue),
      valueYear: sharedYear === undefined ? r.latestYear : null,
      vsTarget: `${formatSigned(r.pctVsTarget, (v) => v.toFixed(0))}%`,
      aboveTarget: r.pctVsTarget > 0,
      neededPerYear: r.neededPerYear === null ? "already below" : `−${r.neededPerYear.toFixed(1)}`,
      changeVsPreviousYear: r.changeVsPreviousYear === null ? DASH : formatSigned(r.changeVsPreviousYear, formatOneDecimal),
    }
  })

  return {
    title: `NO₂ tubes · distance to the ${limits.limitTarget} ${dataset.unit} ${limits.targetYear} value`,
    valueHeader: sharedYear === undefined ? "Latest" : String(sharedYear),
    rows,
  }
}
