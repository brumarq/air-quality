export interface AirQualityStation {
  id: string
  name: string
  lat: number
  lng: number
  aqi: number
  trend: "increasing" | "decreasing" | "stable"
}

export const airQualityStations: AirQualityStation[] = [
  { id: "LU01", name: "Luxembourg City", lat: 49.6116, lng: 6.1319, aqi: 68, trend: "stable" },
  { id: "ES02", name: "Esch-sur-Alzette", lat: 49.4967, lng: 5.9806, aqi: 71, trend: "increasing" },
  { id: "DF03", name: "Differdange", lat: 49.4833, lng: 5.8833, aqi: 70, trend: "increasing" },
  { id: "BT04", name: "Bettembourg", lat: 49.5186, lng: 6.1033, aqi: 69, trend: "stable" },
  { id: "VD05", name: "Vianden", lat: 49.9347, lng: 6.2088, aqi: 62, trend: "decreasing" },
  { id: "MR06", name: "Mersch", lat: 49.75, lng: 6.1333, aqi: 65, trend: "stable" },
  { id: "ET07", name: "Ettelbruck", lat: 49.8547, lng: 6.1567, aqi: 64, trend: "decreasing" },
  { id: "RM08", name: "Remich", lat: 49.5464, lng: 6.3658, aqi: 67, trend: "increasing" },
]

export const getAverageAQI = (): number => {
  const sum = airQualityStations.reduce((acc, station) => acc + station.aqi, 0)
  return Math.round(sum / airQualityStations.length)
}

