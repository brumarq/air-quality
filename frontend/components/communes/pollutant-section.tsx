import type { AirQualityStation } from "@/lib/types/air-quality"
import type { PollutantLimit } from "@/lib/constants/air-quality-limits"
import { StationLimitBar } from "./station-limit-bar"

interface PollutantSectionProps {
  stations: AirQualityStation[]
  limit: PollutantLimit
}

export function PollutantSection({ stations, limit }: PollutantSectionProps) {
  return (
    <div className="py-3 border-t first:border-t-0 first:pt-0">
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="text-sm font-semibold">
          {limit.label} by station · {limit.unit}
        </h4>
        <span className="text-xs text-muted-foreground">
          <span className="text-destructive">2030: {limit.limit2030}</span> · today: {limit.limitToday}
        </span>
      </div>
      <div className="divide-y">
        {stations.map((station) => (
          <StationLimitBar
            key={station.id}
            station={station}
            limit={limit}
            sensor={station.sensors?.find((s) => s.parameter === limit.parameter)}
          />
        ))}
      </div>
    </div>
  )
}
