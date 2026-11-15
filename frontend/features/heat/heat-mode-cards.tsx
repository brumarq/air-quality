"use client"

import type { LoadResult } from "@/shared/lib/static-data"
import type { AsyncState } from "@/shared/lib/use-async"
import {
  BUILDING_KIND_LABEL,
  buildingName,
  cellYear,
  statsForYear,
  type HeatCell,
  type HeatLayerToggles,
  type HeatMapData,
  type HeatSelection,
  type SensitiveBuilding,
  type StudyOverlay,
} from "./model"
import { StatusCard } from "@/shared/ui/status-card"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { Switch } from "@/shared/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { tokens } from "@/shared/theme/tokens"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { scaleLinear } from "d3-scale"
import { BackButton } from "@/shared/ui/back-button"
import { Stat } from "@/shared/ui/stat"
import { formatCelsius, formatCelsiusDifference, formatCount, formatNdvi } from "@/shared/lib/numbers"

interface LayerToggleRow {
  key: keyof HeatLayerToggles
  label: string
  hint: string
}

const FIXED_ROWS: LayerToggleRow[] = [
  { key: "grid", label: "Satellite heat", hint: "Landsat surface temp, 100m" },
  { key: "ndvi", label: "Vegetation (NDVI)", hint: "Sentinel-2, 10m source" },
  { key: "buildings", label: "Schools & care homes", hint: "OSM, point locations" },
]

function layerToggleRows(studyOverlay: StudyOverlay | null): LayerToggleRow[] {
  return studyOverlay ? [...FIXED_ROWS, { key: "studyOverlay", label: studyOverlay.label, hint: studyOverlay.hint }] : FIXED_ROWS
}

export const anomalyColor = scaleLinear<string>()
  .domain(tokens.heat.anomaly.map(([stop]) => stop))
  .range(tokens.heat.anomaly.map(([, color]) => color))
  .clamp(true)

const NOT_PREPARED = "No heat-map data prepared for this commune yet."

interface HeatModeCardsProps {
  load: AsyncState<LoadResult<HeatMapData>>
  year: number | null
  selection: HeatSelection | null
  onBack: () => void
  studyOverlay: StudyOverlay | null
  onSelectYear: (year: number) => void
  toggles: HeatLayerToggles
  onToggle: (key: keyof HeatLayerToggles, value: boolean) => void
}

export function HeatModeCards({ load, year, selection, onBack, studyOverlay, onSelectYear, toggles, onToggle }: HeatModeCardsProps) {
  if (load.status === "loading") return <StatusCard role="status">Loading heat-map data...</StatusCard>
  if (load.status === "error" || load.data.status === "error") return <StatusCard role="alert">Couldn&apos;t load heat data.</StatusCard>
  if (load.data.status === "not-prepared" || year === null) return <StatusCard>{NOT_PREPARED}</StatusCard>

  const data = load.data.data
  if (selection) {
    return <HeatDetailCard data={data} selection={selection} year={year} onBack={onBack} />
  }
  return (
    <HeatMapCard data={data} studyOverlay={studyOverlay} year={year} onSelectYear={onSelectYear} toggles={toggles} onToggle={onToggle} />
  )
}

interface HeatMapCardProps {
  data: HeatMapData
  studyOverlay: StudyOverlay | null
  year: number
  onSelectYear: (year: number) => void
  toggles: HeatLayerToggles
  onToggle: (key: keyof HeatLayerToggles, value: boolean) => void
}

export function HeatMapCard({ data, studyOverlay, year, onSelectYear, toggles, onToggle }: HeatMapCardProps) {
  const years = data.years
  const yearStats = statsForYear(data, year)
  const toggleLabels = layerToggleRows(studyOverlay)

  return (
    <FloatingCard>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-sm">Summer heat, observed by satellite</h3>
        <p className="text-xs text-muted-foreground">
          Surface temperature, not air temperature — morning Landsat pass, ~100m cells.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ToggleGroup
          type="single"
          value={String(year)}
          onValueChange={(value) => value && onSelectYear(Number(value))}
          className="bg-muted rounded-lg p-1 gap-1 grid grid-cols-4"
        >
          {years.map((y) => (
            <ToggleGroupItem
              key={y}
              value={String(y)}
              className="h-8 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {y}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {yearStats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Commune mean" value={formatCelsius(yearStats.communeMeanC)} />
            <Stat label="Hottest 10% of cells" value={`${formatCount(yearStats.hottest10pctCellCount)} cells`} />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex h-3 rounded-sm overflow-hidden">
            {tokens.heat.anomaly.map(([, color]) => (
              <span key={color} className="flex-1" style={{ background: color }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cooler than commune average</span>
            <span>Hotter</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-3 border-t">
          {toggleLabels.map(({ key, label, hint }) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </span>
              <Switch checked={toggles[key]} onCheckedChange={(checked) => onToggle(key, checked)} />
            </label>
          ))}
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          {studyOverlay && `${studyOverlay.attribution} `}Click a square or a pin for detail.
        </p>
      </CardContent>
    </FloatingCard>
  )
}

interface HeatDetailCardProps {
  data: HeatMapData
  selection: HeatSelection
  year: number
  onBack: () => void
}

export const anomalyTooltip = (value: unknown) =>
  typeof value === "number" ? [`${formatCelsiusDifference(value)} vs. commune`, ""] : ["no data", ""]

export function HeatDetailCard({ data, selection, year, onBack }: HeatDetailCardProps) {
  if (selection.type === "cell") {
    const cell = data.cells.find((c) => c.id === selection.id)
    return cell ? <HeatCellCard data={data} cell={cell} year={year} onBack={onBack} /> : null
  }
  const building = data.buildings.find((b) => b.osmId === selection.id)
  return building ? <HeatBuildingCard data={data} building={building} year={year} onBack={onBack} /> : null
}

function HeatCellCard({ data, cell, year, onBack }: { data: HeatMapData; cell: HeatCell; year: number; onBack: () => void }) {
  const current = cellYear(cell, year)
  const nearbyBuildings = data.buildings.filter((b) => b.nearestCellId === cell.id)

  return (
    <FloatingCard>
      <CardHeader className="pb-2 space-y-2">
        <BackButton label="Back to map" onClick={onBack} />
        <div>
          <h3 className="font-semibold text-sm">Grid cell {cell.id}</h3>
          <p className="text-xs text-muted-foreground">~100m × 100m, surface temperature by year</p>
        </div>
      </CardHeader>
      <CardContent>
        {current && (
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <Stat label={`${year} temp`} value={formatCelsius(current.tempC)} />
            <Stat label="vs. commune" value={formatCelsiusDifference(current.anomalyC)} />
            <Stat label="NDVI" value={formatNdvi(current.ndvi)} />
          </div>
        )}

        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={cell.years} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" fontSize={11} stroke={tokens.chart.axis} />
            <YAxis fontSize={11} stroke={tokens.chart.axis} width={32} />
            <Tooltip formatter={anomalyTooltip} />
            <Bar dataKey="anomalyC" radius={[3, 3, 0, 0]}>
              {cell.years.map((y) => (
                <Cell key={y.year} fill={y.anomalyC === null ? tokens.chart.noData : anomalyColor(y.anomalyC)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {nearbyBuildings.length > 0 && (
          <div className="pt-3 mt-2 border-t">
            <p className="text-xs font-medium mb-1">Nearest sensitive buildings</p>
            {nearbyBuildings.map((b) => (
              <p key={b.osmId} className="text-xs text-muted-foreground">
                {BUILDING_KIND_LABEL[b.kind]} — {buildingName(b.name)}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-3 mt-2 border-t">
          Surface temperature (not air temperature), median of cloud-free Landsat 8/9 scenes, June-August {year},
          morning pass ~11:00. Anomaly is relative to that year&apos;s commune-wide mean, not an absolute heat-risk
          rating.
        </p>
      </CardContent>
    </FloatingCard>
  )
}

function HeatBuildingCard({ data, building, year, onBack }: { data: HeatMapData; building: SensitiveBuilding; year: number; onBack: () => void }) {
  const cell = data.cells.find((c) => c.id === building.nearestCellId)
  const anomaly = (cell && cellYear(cell, year)?.anomalyC) ?? null
  const inHottest10pct = statsForYear(data, year)?.hottestCellIds.includes(building.nearestCellId) ?? false

  return (
    <FloatingCard>
      <CardHeader className="pb-2 space-y-2">
        <BackButton label="Back to map" onClick={onBack} />
        <div>
          <h3 className="font-semibold text-sm">{buildingName(building.name)}</h3>
          <p className="text-xs text-muted-foreground">{BUILDING_KIND_LABEL[building.kind]}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p>
            Nearest grid cell runs{" "}
            <span className="font-semibold">{anomaly === null ? "no data" : formatCelsiusDifference(anomaly)}</span> vs. the
            commune average in {year}
            {inHottest10pct ? ", placing it in the hottest 10% of cells that year." : "."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Location from OpenStreetMap, nearest-cell match — a point, not the building&apos;s full footprint. Source:
          cloud-free Landsat 8/9, June-August {year}.
        </p>
      </CardContent>
    </FloatingCard>
  )
}
