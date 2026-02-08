import { Location, Sensor, SensorReading } from '../types/air-quality'

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
  
  static async getLocationReadings(locationId: number, hours: number = 24): Promise<SensorReading[]> {
    // Get sensors for the location, which already include latest readings
    const sensors = await this.getLocationSensors(locationId)
    
    // Convert sensors to readings format
    return sensors
      .filter(sensor => sensor.lastValue !== null && sensor.lastValue !== undefined)
      .map(sensor => ({
        id: sensor.id,
        value: sensor.lastValue!,
        timestamp: sensor.lastUpdated!,
        sensor: sensor
      }))
  }
  
  static async getSensorReadings(sensorId: number, hours: number = 24): Promise<SensorReading[]> {
    // For now, we don't have historical readings endpoint, so return empty array
    // In the future, this would fetch historical data from a readings endpoint
    return []
  }
}