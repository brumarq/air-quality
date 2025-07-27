"use client"

import { Map, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MapControlsProps {
  activeLayer: string
  setActiveLayer: (layer: string) => void
}

export function MapControls({ activeLayer, setActiveLayer }: MapControlsProps) {
  return (
    <div className="p-5 border-b">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Map Controls</h2>
      <div className="space-y-2">
        <Button
          variant={activeLayer === "air-quality" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveLayer("air-quality")}
        >
          <Map className="h-4 w-4 mr-2" />
          <span>Air Quality</span>
        </Button>
      </div>
    </div>
  )
}

