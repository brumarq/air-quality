interface SidebarFooterProps {
  lng: number
  lat: number
  zoom: number
}

export function SidebarFooter({ lng, lat, zoom }: SidebarFooterProps) {
  return (
    <div className="mt-auto p-5 text-xs text-muted-foreground border-t">
      <div className="space-y-1 mb-2">
        <div>Longitude: {lng.toFixed(4)}</div>
        <div>Latitude: {lat.toFixed(4)}</div>
        <div>Zoom: {zoom.toFixed(1)}</div>
      </div>
      <div>© {new Date().getFullYear()} LuxAir</div>
    </div>
  )
}

