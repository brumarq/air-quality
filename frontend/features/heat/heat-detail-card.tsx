"use client"

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUILDING_KIND_LABEL, cellYear, statsForYear, type HeatMapData } from "@/domain/heat"

export type HeatSelection = { type: "cell"; id: string } | { type: "building"; id: string }

interface HeatDetailCardProps {
  data: HeatMapData
  selection: HeatSelection
  year: number
  onBack: () => void
}

function anomalyColor(value: number | null) {
  if (value === null) return "#E5E7EB"
  if (value <= -5) return "#2166AC"
  if (value <= 0) return "#67A9CF"
  if (value <= 5) return "#FDDBC7"
  if (value <= 8) return "#EF8A62"
  return "#B2182B"
}

export function HeatDetailCard({ data, selection, year, onBack }: HeatDetailCardProps) {
  if (selection.type === "cell") {
    const cell = data.cells.find((c) => c.id === selection.id)
    if (!cell) return null

    const rows = cell.years.map((y) => ({ year: String(y.year), anomaly: y.anomalyC, temp: y.tempC, ndvi: y.ndvi }))
    const current = rows.find((r) => r.year === String(year))
    const nearbyBuildings = data.buildings.filter((b) => b.nearestCellId === selection.id)

    return (
      <Card className="pointer-events-auto w-96 shadow-lg">
        <CardHeader className="pb-2 space-y-2">
          <Button variant="ghost" size="sm" className="h-6 -ml-2 px-2 w-fit text-xs text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to map
          </Button>
          <div>
            <h3 className="font-semibold text-sm">Grid cell {selection.id}</h3>
            <p className="text-xs text-muted-foreground">~100m × 100m, surface temperature by year</p>
          </div>
        </CardHeader>
        <CardContent>
          {current && (
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="rounded-md bg-muted px-2 py-1.5">
                <div className="text-muted-foreground">{year} temp</div>
                <div className="font-semibold text-sm">{current.temp?.toFixed(1) ?? "—"}°C</div>
              </div>
              <div className="rounded-md bg-muted px-2 py-1.5">
                <div className="text-muted-foreground">vs. commune</div>
                <div className="font-semibold text-sm">
                  {current.anomaly !== null ? `${current.anomaly > 0 ? "+" : ""}${current.anomaly.toFixed(1)}°C` : "—"}
                </div>
              </div>
              <div className="rounded-md bg-muted px-2 py-1.5">
                <div className="text-muted-foreground">NDVI</div>
                <div className="font-semibold text-sm">{current.ndvi?.toFixed(2) ?? "—"}</div>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="year" fontSize={11} stroke="#737373" />
              <YAxis fontSize={11} stroke="#737373" width={32} />
              <Tooltip
                formatter={(value: number) => (value === null ? ["no data", ""] : [`${value > 0 ? "+" : ""}${value}°C vs. commune`, ""])}
              />
              <Bar dataKey="anomaly" radius={[3, 3, 0, 0]}>
                {rows.map((row) => (
                  <Cell key={row.year} fill={anomalyColor(row.anomaly)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {nearbyBuildings.length > 0 && (
            <div className="pt-3 mt-2 border-t">
              <p className="text-xs font-medium mb-1">Nearest sensitive buildings</p>
              {nearbyBuildings.map((b) => (
                <p key={b.osmId} className="text-xs text-muted-foreground">
                  {BUILDING_KIND_LABEL[b.kind]} — {b.name ?? "(unnamed)"}
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
      </Card>
    )
  }

  const building = data.buildings.find((b) => b.osmId === selection.id)
  if (!building) return null

  const cell = data.cells.find((c) => c.id === building.nearestCellId)
  const currentAnomaly = (cell && cellYear(cell, year)?.anomalyC) ?? null
  const inHottest10pct = statsForYear(data, year)?.hottestCellIds.includes(building.nearestCellId) ?? false

  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardHeader className="pb-2 space-y-2">
        <Button variant="ghost" size="sm" className="h-6 -ml-2 px-2 w-fit text-xs text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to map
        </Button>
        <div>
          <h3 className="font-semibold text-sm">{building.name ?? "(unnamed)"}</h3>
          <p className="text-xs text-muted-foreground">{BUILDING_KIND_LABEL[building.kind]}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p>
            Nearest grid cell runs{" "}
            <span className="font-semibold">
              {currentAnomaly !== null ? `${currentAnomaly > 0 ? "+" : ""}${currentAnomaly.toFixed(1)}°C` : "no data"}
            </span>{" "}
            vs. the commune average in {year}
            {inHottest10pct ? ", placing it in the hottest 10% of cells that year." : "."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Location from OpenStreetMap, nearest-cell match — a point, not the building&apos;s full footprint. Source:
          cloud-free Landsat 8/9, June-August {year}.
        </p>
      </CardContent>
    </Card>
  )
}
