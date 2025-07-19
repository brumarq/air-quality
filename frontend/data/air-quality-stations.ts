import { AirQualityApi } from '../lib/api/air-quality'
import { AirQualityStation } from '../lib/types/air-quality'

export async function getAirQualityStations(): Promise<AirQualityStation[]> {
  const locations = await AirQualityApi.getLocations()
  
  const stations: AirQualityStation[] = []
  
  for (const location of locations) {
    const sensors = await AirQualityApi.getLocationSensors(location.id)
    const readings = await AirQualityApi.getLocationReadings(location.id, 24)
    
    const station: AirQualityStation = {
      id: location.id.toString(),
      name: location.name,
      lat: location.latitude,
      lng: location.longitude,
      sensors,
      readings
    }
    
    stations.push(station)
  }
  
  return stations
}

// Legacy export for backward compatibility
export const airQualityStations: AirQualityStation[] = []

