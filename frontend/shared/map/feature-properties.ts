import type { z } from "zod"
import type { LayerEvent } from "./use-map-layer"

export function firstFeatureProperties<T>(event: LayerEvent, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T | null {
  const result = schema.safeParse(event.features?.[0]?.properties)
  return result.success ? result.data : null
}

export function firstFeaturePoint(event: LayerEvent): [number, number] | null {
  const geometry = event.features?.[0]?.geometry
  if (geometry?.type !== "Point") return null
  const [lng, lat] = geometry.coordinates
  return lng === undefined || lat === undefined ? null : [lng, lat]
}
