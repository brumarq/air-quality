import type { MapStatus } from "@/map/use-mapbox-instance"

/** Covers the map while it loads or after it failed to start; a small notice for later errors. */
export function MapStatusOverlay({ status }: { status: MapStatus }) {
  switch (status.status) {
    case "loading":
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        </div>
      )
    case "error":
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <div role="alert" className="text-sm text-muted-foreground">
            Map unavailable: {status.message}
          </div>
        </div>
      )
    case "ready":
      return status.issue ? (
        <div
          role="status"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 rounded-md bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow"
        >
          Some map content didn&apos;t load: {status.issue}
        </div>
      ) : null
  }
}
