import { AirQualityApi } from '../lib/api/air-quality'
import { AirQualityStation } from '../lib/types/air-quality'

export async function getAirQualityStations(): Promise<AirQualityStation[]> {
  const locations = await AirQualityApi.getLocations()

  return Promise.all(
    locations.map(async (location): Promise<AirQualityStation> => {
      const sensors = await AirQualityApi.getLocationSensors(location.id)
      return {
        id: location.id.toString(),
        name: location.name,
        lat: location.latitude,
        lng: location.longitude,
        sensors,
      }
    })
  )
}

// Legacy export for backward compatibility
export const airQualityStations: AirQualityStation[] = []

