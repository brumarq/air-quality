import type { AirQualityStation } from "@/data/air-quality-stations"
import { getAQIColor, getAQICategory, getTrendArrow, getTrendColor } from "@/lib/utils/aqi-utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface StationCardProps {
  station: AirQualityStation
}

export function StationCard({ station }: StationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base">{station.name}</h3>
          <span className="text-xs text-muted-foreground">{station.id}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Current AQI</div>
            <div className="flex items-center">
              <span className="text-2xl font-semibold" style={{ color: getAQIColor(station.aqi) }}>
                {station.aqi}
              </span>
              <span className="ml-2 text-lg" style={{ color: getTrendColor(station.trend) }}>
                {getTrendArrow(station.trend)}
              </span>
            </div>
            <div className="text-sm" style={{ color: getAQIColor(station.aqi) }}>
              {getAQICategory(station.aqi)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted rounded p-2">
              <div className="text-xs text-muted-foreground">24h Average</div>
              <div className="text-sm font-medium">{Math.round(station.aqi * 0.95)}</div>
            </div>
            <div className="bg-muted rounded p-2">
              <div className="text-xs text-muted-foreground">Trend</div>
              <div className="text-sm font-medium capitalize" style={{ color: getTrendColor(station.trend) }}>
                {station.trend}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

