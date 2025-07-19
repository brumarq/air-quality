import { Location, Sensor, SensorReading } from '../types/air-quality'

const API_BASE_URL = 'http://localhost:8081/api/v1/air-quality'

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
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/readings?hours=${hours}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch readings for location ${locationId}`)
    }
    return response.json()
  }
  
  static async getSensorReadings(sensorId: number, hours: number = 24): Promise<SensorReading[]> {
    const response = await fetch(`${API_BASE_URL}/sensors/${sensorId}/readings?hours=${hours}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch readings for sensor ${sensorId}`)
    }
    return response.json()
  }
}