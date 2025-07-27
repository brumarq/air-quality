import type { AirQualityStation } from "@/lib/types/air-quality"
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
            <div className="text-xs text-muted-foreground mb-1">Location</div>
            <div className="text-sm">
              {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
            </div>
          </div>

          {station.sensors && station.sensors.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Sensors</div>
              <div className="space-y-1">
                {station.sensors.slice(0, 3).map(sensor => (
                  <div key={sensor.id} className="flex justify-between text-sm">
                    <span>{sensor.parameter}</span>
                    <span>{sensor.lastValue ?? 'N/A'} {sensor.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}