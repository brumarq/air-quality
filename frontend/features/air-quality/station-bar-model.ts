import { summarizeStation, type Reading } from "@/domain/air-quality"
import type { PollutantLimit } from "@/domain/limits"
import { formatReadingTime } from "./format-time"
import { LIMIT_STATUS_COLOR } from "./limit-colors"

export interface StationBarModel {
  /** The big number on the right, or "No data". */
  valueText: string
  hasData: boolean
  /** Fill width and colour of the bar, as a percentage of the scale. */
  fillPct: number
  fillColor: string | null
  limitTodayPct: number
  limit2030Pct: number
  caption: string
  /** Shown only when some readings had another unit and were left out. */
  droppedNote: string | null
}

// The bar runs to 25% past today's limit, so readings just over it still show headroom.
const SCALE_PAST_LIMIT = 1.25

const pctOf = (value: number, scaleMax: number) => Math.min(100, (value / scaleMax) * 100)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export function buildStationBar(points: Reading[], limit: PollutantLimit, live: boolean): StationBarModel {
  const summary = summarizeStation(points, limit, live ? "latest" : "average")
  const scaleMax = limit.limitToday * SCALE_PAST_LIMIT
  const droppedNote = summary.droppedOtherUnit === 0 ? null : `${plural(summary.droppedOtherUnit, "reading")} in other units ignored`
  const limitTodayPct = pctOf(limit.limitToday, scaleMax)
  const limit2030Pct = pctOf(limit.limit2030, scaleMax)

  if (summary.status === "no-data") {
    return {
      valueText: "No data",
      hasData: false,
      fillPct: 0,
      fillColor: null,
      limitTodayPct,
      limit2030Pct,
      caption: "No recent reading for this period",
      droppedNote,
    }
  }

  const latest = formatReadingTime(summary.latestAt)
  return {
    valueText: summary.value.toFixed(1),
    hasData: true,
    fillPct: pctOf(summary.value, scaleMax),
    fillColor: LIMIT_STATUS_COLOR[summary.limitStatus],
    limitTodayPct,
    limit2030Pct,
    caption: live ? `Latest reading · ${latest}` : `Average of ${plural(summary.count, "reading")} · latest ${latest}`,
    droppedNote,
  }
}
