import { CardContent, CardHeader } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { POLLUTANT_LIMITS, POLLUTANT_PARAMETERS, type PollutantLimit, type PollutantParameter, LIMIT_STATUS_LABEL, LIMIT_STATUS_ORDER, type LimitStatus } from "@/shared/domain/limits"
import type { AsyncState } from "@/shared/lib/use-async"
import { type StationHistory, type SensorHistory, type AirQualityStation, type Reading, type TimeRangeOption, stationColor, summarizeStation } from "./model"
import { LUXEMBOURG_TIME_ZONE } from "./time"
import { tokens } from "@/shared/theme/tokens"
import { LOCALE, formatConcentrationNumber, formatCount, formatLimitNumber } from "@/shared/lib/numbers"

const LIMIT_STATUS_COLOR: Record<LimitStatus, string> = {
  "below-2030": tokens.status.below2030,
  "above-2030": tokens.status.above2030,
  "above-today": tokens.status.aboveToday,
}

const readingTime = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
  timeZone: LUXEMBOURG_TIME_ZONE,
})

export const formatReadingTime = (at: Date) => readingTime.format(at)

const BAR_MAX_VS_TODAYS_LIMIT = 1.25

const pctOf = (value: number, scaleMax: number) => Math.min(100, (value / scaleMax) * 100)
const plural = (n: number, word: string) => `${formatCount(n)} ${word}${n === 1 ? "" : "s"}`

interface CommuneReadingsPanelProps {
  history: AsyncState<SensorHistory>
  selectedLimit: PollutantLimit
  range: TimeRangeOption
  onSelectParameter: (parameter: PollutantParameter) => void
}

export function CommuneReadingsPanel({ history, selectedLimit, range, onSelectParameter }: CommuneReadingsPanelProps) {
  return (
    <FloatingCard className="flex-1 min-h-0 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base">Air quality</h3>
          <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-ink-soft">{range.chip}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {POLLUTANT_PARAMETERS.map((parameter) => (
            <PollutantSummaryTile
              key={parameter}
              limit={POLLUTANT_LIMITS[parameter]}
              selected={parameter === selectedLimit.parameter}
              onSelect={() => onSelectParameter(parameter)}
            />
          ))}
        </div>

        <LimitStatusLegend />

        <div className="flex-1 min-h-0 overflow-y-auto pt-4 border-t">
          {history.status === "loading" ? (
            <div className="py-6 text-sm text-muted-foreground text-center">Loading...</div>
          ) : history.status === "error" ? (
            <div role="alert" className="py-6 text-sm text-muted-foreground text-center">
              Couldn&apos;t load readings.
            </div>
          ) : (
            <PollutantSection history={history.data.stations} limit={selectedLimit} live={range.live} />
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t shrink-0">{range.footnote}</p>
      </CardContent>
    </FloatingCard>
  )
}

interface PollutantSectionProps {
  history: StationHistory[]
  limit: PollutantLimit
  live: boolean
}

export function PollutantSection({ history, limit, live }: PollutantSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold">
          {limit.label} by station · {limit.unit}
        </h4>
        <span className="flex gap-3 text-xs font-medium">
          <span className="text-limit-target">2030: {formatLimitNumber(limit.limit2030)}</span>
          <span className="text-limit-today">today: {formatLimitNumber(limit.limitToday)}</span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {history.map(({ station, points }, i) => (
          <StationLimitBar
            key={station.id}
            station={station}
            color={stationColor(i)}
            points={points}
            limit={limit}
            live={live}
          />
        ))}
      </div>
    </div>
  )
}

interface StationLimitBarProps {
  station: AirQualityStation
  color: string
  points: Reading[]
  limit: PollutantLimit
  live: boolean
}

export function StationLimitBar({ station, color, points, limit, live }: StationLimitBarProps) {
  const summary = summarizeStation(points, limit, live ? "latest" : "average")
  const scaleMax = limit.limitToday * BAR_MAX_VS_TODAYS_LIMIT
  const hasData = summary.status === "ok"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className={`w-4 h-1 rounded-sm -translate-y-1 ${hasData ? "" : "opacity-30"}`} style={{ background: color }} />
          <span className="text-sm font-medium">{station.name}</span>
        </span>
        <span className={hasData ? "text-lg font-semibold tabular-nums" : "text-sm text-muted-foreground"}>
          {hasData ? formatConcentrationNumber(summary.value) : "No data"}
        </span>
      </div>
      <div className="relative h-4">
        <div className="absolute top-1 left-0 right-0 h-2 rounded bg-bar-track" />
        {hasData && (
          <>
            <div
              className="absolute top-1 left-0 h-2 rounded"
              style={{ width: `${pctOf(summary.value, scaleMax)}%`, background: LIMIT_STATUS_COLOR[summary.limitStatus] }}
            />
            <div className="absolute top-0 h-4 w-1 -ml-px" style={{ left: `${pctOf(limit.limit2030, scaleMax)}%`, background: tokens.limit.target2030 }} />
            <div className="absolute top-0 h-4 w-1 -ml-px" style={{ left: `${pctOf(limit.limitToday, scaleMax)}%`, background: tokens.limit.today }} />
          </>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {!hasData
          ? "No recent reading for this period"
          : live
            ? `Latest reading · ${formatReadingTime(summary.latestAt)}`
            : `Average of ${plural(summary.count, "reading")} · latest ${formatReadingTime(summary.latestAt)}`}
      </span>
      {summary.droppedOtherUnit > 0 && (
        <span className="text-xs text-muted-foreground">{plural(summary.droppedOtherUnit, "reading")} in other units ignored</span>
      )}
    </div>
  )
}

interface PollutantSummaryTileProps {
  limit: PollutantLimit
  selected: boolean
  onSelect: () => void
}

export function PollutantSummaryTile({ limit, selected, onSelect }: PollutantSummaryTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border rounded-lg p-3 transition-colors hover:border-primary/50 ${
        selected ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      <div className="text-sm font-semibold">{limit.label}</div>
      <div className="text-xs text-muted-foreground mt-1">{limit.unit}</div>
    </button>
  )
}

export function LimitStatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {LIMIT_STATUS_ORDER.map((status) => (
        <span key={status} className="flex items-center gap-2">
          <LimitStatusDot status={status} />
          {LIMIT_STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  )
}

export function LimitStatusDot({ status }: { status: LimitStatus }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: LIMIT_STATUS_COLOR[status] }} />
}
