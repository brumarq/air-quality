"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { statsForYear, type HeatMapData, type StudyOverlay } from "@/domain/heat"
import { tokens } from "@/theme/tokens"
import type { HeatLayerToggles } from "./use-heat-map-layers"

interface HeatMapCardProps {
  data: HeatMapData
  studyOverlay: StudyOverlay | null
  year: number
  onSelectYear: (year: number) => void
  toggles: HeatLayerToggles
  onToggle: (key: keyof HeatLayerToggles, value: boolean) => void
}

type ToggleLabel = { key: keyof HeatLayerToggles; label: string; hint: string }

const LAYER_TOGGLES: ToggleLabel[] = [
  { key: "grid", label: "Satellite heat", hint: "Landsat surface temp, 100m" },
  { key: "ndvi", label: "Vegetation (NDVI)", hint: "Sentinel-2, 10m source" },
  { key: "buildings", label: "Schools & care homes", hint: "OSM, point locations" },
]

export function HeatMapCard({ data, studyOverlay, year, onSelectYear, toggles, onToggle }: HeatMapCardProps) {
  const years = data.years
  const yearStats = statsForYear(data, year)
  const toggleLabels: ToggleLabel[] = studyOverlay
    ? [...LAYER_TOGGLES, { key: "studyOverlay", label: studyOverlay.label, hint: studyOverlay.hint }]
    : LAYER_TOGGLES

  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
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
            <div className="rounded-md bg-muted px-2 py-1.5">
              <div className="text-muted-foreground">Commune mean</div>
              <div className="font-semibold text-sm">{yearStats.communeMeanC.toFixed(1)}°C</div>
            </div>
            <div className="rounded-md bg-muted px-2 py-1.5">
              <div className="text-muted-foreground">Hottest 10% of cells</div>
              <div className="font-semibold text-sm">{yearStats.hottest10pctCellCount} cells</div>
            </div>
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
    </Card>
  )
}
