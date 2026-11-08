// Backend client. Every response is parsed with zod here, so the rest of the app can
// trust the domain types. The backend sends null for missing fields; the schemas turn
// that into undefined to match the optional fields in domain/air-quality.ts.

import { z } from "zod"
import type { AirQualityStation, Location, Sensor, SensorReadingHistoryPoint } from "@/domain/air-quality"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1/air-quality"

const optional = <T extends z.ZodTypeAny>(schema: T) => schema.nullish().transform((v) => v ?? undefined)

const LocationSchema: z.ZodType<Location, z.ZodTypeDef, unknown> = z.object({
  id: z.number(),
  name: z.string(),
  city: optional(z.string()),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

const SensorSchema: z.ZodType<Sensor, z.ZodTypeDef, unknown> = z.object({
  id: z.number(),
  sensorId: z.number(),
  parameter: z.string(),
  unit: optional(z.string()),
  lastValue: optional(z.number()),
  lastUpdated: optional(z.string()),
  locationId: optional(z.number()),
})

const ReadingSchema: z.ZodType<SensorReadingHistoryPoint, z.ZodTypeDef, unknown> = z.object({
  timestamp: z.string(),
  value: z.number(),
  unit: z.string(),
})

async function getJson<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`)
  }
  const result = schema.safeParse(await response.json())
  if (!result.success) {
    throw new Error(`GET ${path} returned an unexpected shape: ${result.error.message}`)
  }
  return result.data
}

export const AirQualityApi = {
  getLocations: () => getJson("/locations", z.array(LocationSchema)),

  getLocationSensors: (locationId: number) => getJson(`/locations/${locationId}/sensors`, z.array(SensorSchema)),

  getSensorReadingHistory: (sensorId: number, from: Date, to: Date) => {
    const params = new URLSearchParams({ from: toLocalIsoString(from), to: toLocalIsoString(to) })
    return getJson(`/sensors/${sensorId}/readings?${params}`, z.array(ReadingSchema))
  },
}

/** All stations with their sensors: one request for locations, then one per location in parallel. */
export async function getAirQualityStations(): Promise<AirQualityStation[]> {
  const locations = await AirQualityApi.getLocations()
  return Promise.all(
    locations.map(async (location) => ({
      id: location.id.toString(),
      name: location.name,
      lat: location.latitude,
      lng: location.longitude,
      sensors: await AirQualityApi.getLocationSensors(location.id),
    })),
  )
}

// Backend parses this as a timezone-naive LocalDateTime, so strip the "Z"/offset
// Date.toISOString() would add - it must match the naive timestamps already stored.
function toLocalIsoString(date: Date): string {
  return date.toISOString().slice(0, 19)
}
