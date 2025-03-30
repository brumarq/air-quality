'use client'

import dynamic from "next/dynamic"

// Dynamically import the MapLayout component with no SSR
const MapLayout = dynamic(() => import("@/components/layout/map-layout").then((mod) => mod.MapLayout), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
})

export default function Home() {
  return <MapLayout />
}

