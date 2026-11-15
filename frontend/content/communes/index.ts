import type { CommuneArea } from "@/content/area"
import { ESCH_SUR_ALZETTE } from "./esch-sur-alzette"

export const COMMUNES: readonly CommuneArea[] = [ESCH_SUR_ALZETTE]

export function findCommune(slug: string): CommuneArea | null {
  return COMMUNES.find((commune) => commune.slug === slug) ?? null
}
