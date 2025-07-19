import { useState, useEffect } from "react"
import { getAirQualityStations } from "@/data/air-quality-stations"
import { Card, CardContent } from "@/components/ui/card"
import { AirQualityStation } from "@/lib/types/air-quality"

interface MetricsGridProps {
  className?: string
}

export function MetricsGrid({ className }: MetricsGridProps) {
  const [stations, setStations] = useState<AirQualityStation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStations() {
      try {
        const data = await getAirQualityStations()
        setStations(data)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStations()
  }, [])

  const totalSensors = stations.reduce((sum, station) => sum + (station.sensors?.length || 0), 0)
  const totalReadings = stations.reduce((sum, station) => sum + (station.readings?.length || 0), 0)
  const avgPM25 = stations.reduce((sum, station) => {
    const pm25Sensor = station.sensors?.find(s => s.parameter === 'pm25')
    return sum + (pm25Sensor?.lastValue || 0)
  }, 0) / stations.filter(s => s.sensors?.some(sensor => sensor.parameter === 'pm25')).length

  if (loading) {
    return (
      <div className={`p-5 border-b ${className}`}>
        <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Metrics</h2>
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`p-5 border-b ${className}`}>
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Metrics</h2>
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">{stations.length}</div>
            <div className="text-xs text-muted-foreground">Stations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">{totalSensors}</div>
            <div className="text-xs text-muted-foreground">Sensors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">
              {avgPM25 ? avgPM25.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Avg PM2.5</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-semibold">{totalReadings}</div>
            <div className="text-xs text-muted-foreground">Readings</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

