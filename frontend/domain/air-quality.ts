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
  lastUpdated?: Date
  locationId?: number
}

/** One measurement. `at` is an absolute instant; api/ converts the backend's zoneless UTC strings. */
export interface Reading {
  at: Date
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
  /** Oldest first. */
  points: Reading[]
}
