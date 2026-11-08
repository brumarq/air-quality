import { z } from "zod"
import { NO2_LIMITS } from "@/domain/limits"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { loadStaticJson, type LoadResult } from "@/api/static-data"

// The campaign files key readings and sources by year ("2024": ...). The schema checks
// them and turns them into arrays sorted by numeric year.

const YearKey = z.string().regex(/^\d{4}$/, "expected a four-digit year")

const SourceSchema = z.object({ title: z.string(), url: z.string().url(), page: z.number().int().positive() })

const TubeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  note: z.string().optional(),
  tubeIds: z.array(z.string()),
  lat: z.number(),
  lng: z.number(),
  approximateLocation: z.boolean(),
  readings: z.record(YearKey, z.number().nonnegative().nullable()),
})

const byYear = (a: { year: number }, b: { year: number }) => a.year - b.year

export const No2TubeDatasetSchema: z.ZodType<No2TubeDataset, z.ZodTypeDef, unknown> = z
  .object({
    commune: z.string(),
    pollutant: z.literal("no2"),
    unit: z.string(),
    // The file repeats the limits it was prepared against. The app's own limits live in
    // domain/limits.ts; a file that disagrees is rejected rather than shown against the
    // wrong lines.
    limitToday: z.literal(NO2_LIMITS.limitToday),
    limit2030: z.literal(NO2_LIMITS.limitTarget),
    method: z.string(),
    sources: z.record(YearKey, SourceSchema),
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
    const sources = Object.entries(file.sources)
      .map(([year, source]) => ({ year: Number(year), ...source }))
      .sort(byYear)
    return {
      commune: file.commune,
      unit: file.unit,
      method: file.method,
      campaignYears: sources.map((s) => s.year),
      sources,
      tubes: file.tubes.map(({ readings, ...tube }) => ({
        ...tube,
        readings: Object.entries(readings)
          .flatMap(([year, value]) => (value === null ? [] : [{ year: Number(year), value }]))
          .sort(byYear),
      })),
    }
  })

/** The commune's Pacte Climat tube campaign, from public/data/<slug>/no2-tubes.json. */
export function fetchNo2TubeDataset(communeSlug: string, signal?: AbortSignal): Promise<LoadResult<No2TubeDataset>> {
  return loadStaticJson(`/data/${communeSlug}/no2-tubes.json`, No2TubeDatasetSchema, signal)
}
