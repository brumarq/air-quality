import type { CommuneArea } from "@/domain/area"
import { ESCH_SUR_ALZETTE } from "./esch-sur-alzette"

/** Every commune with a profile page. A new commune is one file here plus its data. */
export const COMMUNES: readonly CommuneArea[] = [ESCH_SUR_ALZETTE]

export function findCommune(slug: string): CommuneArea | null {
  return COMMUNES.find((commune) => commune.slug === slug) ?? null
}
