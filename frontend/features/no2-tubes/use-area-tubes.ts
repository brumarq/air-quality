"use client"

import { fetchNo2TubeDataset } from "./api"
import type { No2TubeDataset } from "./model"
import { useAsync } from "@/shared/lib/use-async"

export type AreaTubes =
  | { status: "none" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; dataset: No2TubeDataset }

export function useAreaTubes(communeSlug: string | null): AreaTubes {
  const load = useAsync(communeSlug && `no2-tubes|${communeSlug}`, (signal) => fetchNo2TubeDataset(communeSlug ?? "", signal))

  if (communeSlug === null) return { status: "none" }
  if (load.status === "loading") return { status: "loading" }
  if (load.status === "error" || load.data.status === "error") return { status: "error" }
  if (load.data.status === "not-prepared") return { status: "none" }
  return { status: "ready", dataset: load.data.data }
}
