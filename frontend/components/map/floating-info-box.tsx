"use client"

import { X } from "lucide-react"
import type { AirQualityStation } from "@/lib/types/air-quality"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface FloatingInfoBoxProps {
  station: AirQualityStation
  onClose: () => void
}

export function FloatingInfoBox({ station, onClose }: FloatingInfoBoxProps) {
  // Get latest sensor readings
  const pm25Sensor = station.sensors?.find(s => s.parameter === 'pm25')
  const pm10Sensor = station.sensors?.find(s => s.parameter === 'pm10')
  const no2Sensor = station.sensors?.find(s => s.parameter === 'no2')
  const o3Sensor = station.sensors?.find(s => s.parameter === 'o3')

  return (
    <Card className="absolute bottom-5 left-5 w-80 shadow-lg z-10 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <h3 className="font-semibold text-base">{station.name}</h3>
          <span className="text-xs text-muted-foreground">Station ID: {station.id}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">Latest Readings</div>
          <div className="grid grid-cols-2 gap-3">
            {pm25Sensor && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">PM2.5</div>
                <div className="text-lg font-semibold">
                  {pm25Sensor.lastValue?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">{pm25Sensor.unit}</div>
              </div>
            )}
            {pm10Sensor && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">PM10</div>
                <div className="text-lg font-semibold">
                  {pm10Sensor.lastValue?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">{pm10Sensor.unit}</div>
              </div>
            )}
            {no2Sensor && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">NO₂</div>
                <div className="text-lg font-semibold">
                  {no2Sensor.lastValue?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">{no2Sensor.unit}</div>
              </div>
            )}
            {o3Sensor && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">O₃</div>
                <div className="text-lg font-semibold">
                  {o3Sensor.lastValue?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">{o3Sensor.unit}</div>
              </div>
            )}
          </div>
          {station.sensors && station.sensors.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              Total sensors: {station.sensors.length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

