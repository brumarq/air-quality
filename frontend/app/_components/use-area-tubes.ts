"use client"

import { fetchNo2TubeDataset } from "@/api/no2-tubes"
import type { Area } from "@/domain/area"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import { useAsync } from "@/lib/use-async"

export type AreaTubes =
  | { status: "none" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; dataset: No2TubeDataset }

/** The area's NO2 tube campaign, if its content says it has one. Shared by both modes. */
export function useAreaTubes(area: Area): AreaTubes {
  const slug = area.kind === "commune" && area.datasets.no2Tubes ? area.slug : null
  const load = useAsync(slug && `no2-tubes|${slug}`, (signal) => fetchNo2TubeDataset(slug ?? "", signal))

  if (slug === null) return { status: "none" }
  if (load.status === "loading") return { status: "loading" }
  if (load.status === "error" || load.data.status === "error") return { status: "error" }
  if (load.data.status === "not-prepared") return { status: "none" }
  return { status: "ready", dataset: load.data.data }
}
