"use client"

import dynamic from "next/dynamic"
import type { CommuneConfig } from "@/domain/communes"

const MapLayout = dynamic(() => import("@/components/layout/map-layout").then((m) => m.MapLayout), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
})

export function CommuneMap({ communeConfig }: { communeConfig: CommuneConfig }) {
  return <MapLayout communeConfig={communeConfig} />
}
