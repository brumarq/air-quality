export interface Location {
  id: number
  name: string
  city?: string
  country: string
  latitude: number
  longitude: number
}

export interface Sensor {
  id: number
  sensorId: number
  parameter: string
  unit?: string
  lastValue?: number
  lastUpdated?: string
  locationId?: number
}

export interface SensorReadingHistoryPoint {
  timestamp: string
  value: number
  unit: string
}

export interface AirQualityStation {
  id: string
  name: string
  lat: number
  lng: number
  sensors?: Sensor[]
}

export interface StationHistory {
  station: AirQualityStation
  points: SensorReadingHistoryPoint[]
}
