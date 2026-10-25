import type { AirQualityStation } from "@/lib/types/air-quality"
import { formatParameterLabel } from "@/lib/format-parameter"

function stationStatus(station: AirQualityStation): string {
  const isReporting = station.sensors?.some((s) => s.lastValue != null)
  if (isReporting) return "reporting"

  const lastUpdated = station.sensors
    ?.map((s) => s.lastUpdated)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  return lastUpdated ? `offline since ${new Date(lastUpdated).toLocaleDateString()}` : "no data"
}

export function CommuneStations({ stations }: { stations: AirQualityStation[] }) {
  return (
    <div className="p-5 border-b">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Stations</h2>
      <div className="space-y-3">
        {stations.map((station) => {
          const parameters = Array.from(new Set(station.sensors?.map((s) => s.parameter) ?? []))
          const isReporting = station.sensors?.some((s) => s.lastValue != null)

          return (
            <div key={station.id} className="flex gap-2">
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${isReporting ? "bg-[hsl(var(--chart-2))]" : "bg-muted-foreground"}`}
              />
              <div>
                <div className="text-sm font-medium">{station.name}</div>
                <div className="text-xs text-muted-foreground">
                  ID {station.id} · {parameters.map(formatParameterLabel).join(", ")} · {stationStatus(station)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
