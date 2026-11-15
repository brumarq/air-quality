"use client"

import dynamic from "next/dynamic"
import type { Area } from "@/content/area"
import { LUXEMBOURG } from "@/content/areas/luxembourg"
import { findCommune } from "@/content/communes"

const MapLayout = dynamic(() => import("./map-layout").then((m) => m.MapLayout), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
})

export function CommuneMap({ communeSlug }: { communeSlug: string | null }) {
  const area: Area | null = communeSlug === null ? LUXEMBOURG : findCommune(communeSlug)
  if (!area) return null
  return <MapLayout area={area} />
}
