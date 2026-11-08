import { Location, Sensor, SensorReadingHistoryPoint } from '@/domain/air-quality'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1/air-quality'

export class AirQualityApi {
  
  static async getLocations(): Promise<Location[]> {
    const response = await fetch(`${API_BASE_URL}/locations`)
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    return response.json()
  }
  
  static async getLocationSensors(locationId: number): Promise<Sensor[]> {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/sensors`)
    if (!response.ok) {
      throw new Error(`Failed to fetch sensors for location ${locationId}`)
    }
    return response.json()
  }
  
  static async getSensorReadingHistory(sensorId: number, from: Date, to: Date): Promise<SensorReadingHistoryPoint[]> {
    const params = new URLSearchParams({
      from: toLocalIsoString(from),
      to: toLocalIsoString(to),
    })
    const response = await fetch(`${API_BASE_URL}/sensors/${sensorId}/readings?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch reading history for sensor ${sensorId}`)
    }
    return response.json()
  }
}

// Backend parses this as a timezone-naive LocalDateTime, so strip the "Z"/offset
// Date.toISOString() would add - it must match the naive timestamps already stored.
function toLocalIsoString(date: Date): string {
  return date.toISOString().slice(0, 19)
}