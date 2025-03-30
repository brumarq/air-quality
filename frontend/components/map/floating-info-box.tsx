"use client"

import { X } from "lucide-react"
import type { AirQualityStation } from "@/data/air-quality-stations"
import { getAQIColor, getAQICategory, getTrendArrow, getTrendColor } from "@/lib/utils/aqi-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface FloatingInfoBoxProps {
  station: AirQualityStation
  onClose: () => void
}

export function FloatingInfoBox({ station, onClose }: FloatingInfoBoxProps) {
  return (
    <Card className="absolute bottom-5 left-5 w-64 shadow-lg z-10 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <h3 className="font-semibold text-base">{station.name}</h3>
          <span className="text-xs text-muted-foreground">{station.id}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">AQI</div>
            <div className="text-lg font-semibold" style={{ color: getAQIColor(station.aqi) }}>
              {station.aqi}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-sm font-medium" style={{ color: getAQIColor(station.aqi) }}>
              {getAQICategory(station.aqi)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Trend</div>
            <div className="text-sm font-medium flex items-center" style={{ color: getTrendColor(station.trend) }}>
              {getTrendArrow(station.trend)}
              <span className="ml-1 capitalize">{station.trend}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

