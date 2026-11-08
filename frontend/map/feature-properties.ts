import type { z } from "zod"
import type { LayerEvent } from "./use-map-layer"

/** The properties of the first feature under the pointer, if they match `schema`. */
export function featureProperties<T>(event: LayerEvent, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T | null {
  const result = schema.safeParse(event.features?.[0]?.properties)
  return result.success ? result.data : null
}

/** The coordinates of the first feature under the pointer, if it's a point. */
export function featurePoint(event: LayerEvent): [number, number] | null {
  const geometry = event.features?.[0]?.geometry
  if (geometry?.type !== "Point") return null
  const [lng, lat] = geometry.coordinates
  return lng === undefined || lat === undefined ? null : [lng, lat]
}
