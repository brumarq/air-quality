import { Crosshair, Minus, Plus } from "lucide-react"
import type { CommuneConfig } from "@/data/communes"

interface CustomMapControlsProps {
  map: mapboxgl.Map | null
  communeConfig: CommuneConfig
}

export function CustomMapControls({ map, communeConfig }: CustomMapControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col border rounded-lg bg-white shadow-md overflow-hidden">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => map?.zoomIn()}
        className="flex items-center justify-center w-9 h-9 border-b hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => map?.zoomOut()}
        className="flex items-center justify-center w-9 h-9 border-b hover:bg-muted"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Recenter on ${communeConfig.name}`}
        onClick={() => map?.flyTo({ center: communeConfig.center, zoom: communeConfig.zoom })}
        className="flex items-center justify-center w-9 h-9 hover:bg-muted"
      >
        <Crosshair className="h-4 w-4" />
      </button>
    </div>
  )
}
