import { z } from "zod"
import { POLLUTANT_LIMITS } from "@/shared/domain/limits"
import type { No2TubeDataset } from "./model"
import { loadStaticJson, type LoadResult } from "@/shared/lib/static-data"

const YearKey = z.string().regex(/^\d{4}$/, "expected a four-digit year")

const TubeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  approximateLocation: z.boolean(),
  readings: z.record(YearKey, z.number().nonnegative().nullable()),
})

const byYear = (a: { year: number }, b: { year: number }) => a.year - b.year

export const No2TubeDatasetSchema: z.ZodType<No2TubeDataset, z.ZodTypeDef, unknown> = z
  .object({
    pollutant: z.literal("no2"),
    unit: z.literal(POLLUTANT_LIMITS.no2.unit),
    limitToday: z.literal(POLLUTANT_LIMITS.no2.limitToday),
    limit2030: z.literal(POLLUTANT_LIMITS.no2.limit2030),
    sources: z.record(YearKey, z.unknown()),
    tubes: z.array(TubeSchema),
  })
  .superRefine((file, ctx) => {
    const campaignYears = new Set(Object.keys(file.sources))
    for (const tube of file.tubes) {
      for (const year of Object.keys(tube.readings)) {
        if (!campaignYears.has(year)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `tube ${tube.id} has a ${year} reading but no ${year} source` })
        }
      }
    }
  })
  .transform((file) => {
    const campaignYears = Object.keys(file.sources)
      .map(Number)
      .sort((a, b) => a - b)
    return {
      campaignYears,
      tubes: file.tubes.map(({ readings, ...tube }) => ({
        ...tube,
        readings: Object.entries(readings)
          .flatMap(([year, value]) => (value === null ? [] : [{ year: Number(year), value }]))
          .sort(byYear),
      })),
    }
  })

export function fetchNo2TubeDataset(communeSlug: string, signal?: AbortSignal): Promise<LoadResult<No2TubeDataset>> {
  return loadStaticJson(`/data/${communeSlug}/no2-tubes.json`, No2TubeDatasetSchema, signal)
}
