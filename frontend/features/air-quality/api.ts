import { z } from "zod"
import type { AirQualityStation, Location, Reading, Sensor } from "./model"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1/air-quality"

const optional = <T extends z.ZodTypeAny>(schema: T) => schema.nullish().transform((v) => v ?? undefined)

const ZONELESS_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/

export const UtcTimestampSchema = z
  .string()
  .regex(ZONELESS_TIMESTAMP, "expected a zoneless UTC timestamp like 2026-11-08T10:00:00")
  .transform((value) => new Date(`${value}Z`))
  .refine((date) => !Number.isNaN(date.getTime()), "not a real date")

const LocationSchema: z.ZodType<Location, z.ZodTypeDef, unknown> = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

const SensorSchema: z.ZodType<Sensor, z.ZodTypeDef, unknown> = z.object({
  id: z.number(),
  sensorId: z.number(),
  parameter: z.string(),
  unit: optional(z.string()),
})

const ReadingSchema: z.ZodType<Reading, z.ZodTypeDef, unknown> = z
  .object({
    timestamp: UtcTimestampSchema,
    value: z.number(),
    unit: z.string(),
  })
  .transform(({ timestamp, ...rest }) => ({ at: timestamp, ...rest }))

const ReadingsSchema = z.array(ReadingSchema).transform((readings) => readings.sort((a, b) => a.at.getTime() - b.at.getTime()))

async function getJson<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
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
  getLocations: (signal?: AbortSignal) => getJson("/locations", z.array(LocationSchema), signal),

  getLocationSensors: (locationId: number, signal?: AbortSignal) =>
    getJson(`/locations/${locationId}/sensors`, z.array(SensorSchema), signal),

  getSensorReadingHistory: (sensorId: number, from: Date, to: Date, signal?: AbortSignal) => {
    const params = new URLSearchParams({ from: toZonelessUtcString(from), to: toZonelessUtcString(to) })
    return getJson(`/sensors/${sensorId}/readings?${params}`, ReadingsSchema, signal)
  },
}

export async function getAreaStations(stationIds: number[], signal?: AbortSignal): Promise<AirQualityStation[]> {
  const locations = await AirQualityApi.getLocations(signal)
  const byId = new Map(locations.map((location) => [location.id, location]))
  const known = stationIds.flatMap((id) => {
    const location = byId.get(id)
    return location ? [location] : []
  })
  return Promise.all(
    known.map(async (location) => ({
      id: location.id,
      name: location.name,
      lat: location.latitude,
      lng: location.longitude,
      sensors: await AirQualityApi.getLocationSensors(location.id, signal),
    })),
  )
}

function toZonelessUtcString(date: Date): string {
  return date.toISOString().slice(0, 19)
}
