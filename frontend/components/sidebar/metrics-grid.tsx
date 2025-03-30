import { airQualityStations, getAverageAQI } from "@/data/air-quality-stations"
import { Card, CardContent } from "@/components/ui/card"

interface MetricsGridProps {
  className?: string
}

export function MetricsGrid({ className }: MetricsGridProps) {
  return (
    <div className={`p-5 border-b ${className}`}>
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Metrics</h2>
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">{airQualityStations.length}</div>
            <div className="text-xs text-muted-foreground">Stations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">{getAverageAQI()}</div>
            <div className="text-xs text-muted-foreground">Avg. AQI</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">
              99.2<span className="text-xs">%</span>
            </div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">6.2k</div>
            <div className="text-xs text-muted-foreground">Data Points</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

