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
  unit: string
  lastValue: number
  lastUpdated: string
  locationId: number
}

export interface SensorReading {
  id: number
  value: number
  timestamp: string
  sensor: Sensor
}

export interface AirQualityStation {
  id: string
  name: string
  lat: number
  lng: number
  sensors?: Sensor[]
  readings?: SensorReading[]
}