import { Crosshair, Minus, Plus } from "lucide-react"

interface CustomMapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
  /** What "recenter" goes back to, for the button's label (e.g. "Esch-sur-Alzette"). */
  recenterLabel: string
}

export function CustomMapControls({ onZoomIn, onZoomOut, onRecenter, recenterLabel }: CustomMapControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col border rounded-lg bg-control shadow-md overflow-hidden">
      <button type="button" aria-label="Zoom in" onClick={onZoomIn} className="flex items-center justify-center w-9 h-9 border-b hover:bg-muted">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Zoom out" onClick={onZoomOut} className="flex items-center justify-center w-9 h-9 border-b hover:bg-muted">
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Recenter on ${recenterLabel}`}
        onClick={onRecenter}
        className="flex items-center justify-center w-9 h-9 hover:bg-muted"
      >
        <Crosshair className="h-4 w-4" />
      </button>
    </div>
  )
}
