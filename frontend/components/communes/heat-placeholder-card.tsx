import { Card, CardContent } from "@/components/ui/card"

const RAMP_COLORS = ["#FEF3C7", "#FCD34D", "#FB923C", "#EA580C", "#9A3412"]

export function HeatPlaceholderCard() {
  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Summer heat</h2>
            <span className="text-xs text-muted-foreground">Morning land surface temperature, one summer composite</span>
          </div>
          <span className="shrink-0 px-2 py-1 rounded-md bg-muted text-xs font-medium text-neutral-600">
            Sample layer
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {RAMP_COLORS.map((color) => (
              <span key={color} className="flex-1 h-3 rounded-sm" style={{ background: color }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cooler</span>
            <span>Hotter</span>
          </div>
        </div>

        <p className="text-sm text-neutral-600">
          Each square is about 100 m across. Darker squares were hotter when the satellite passed, around 10:30 in
          the morning. Afternoon peaks are hotter than shown here.
        </p>

        <div className="grid grid-cols-[84px_1fr] gap-x-2 gap-y-2 pt-4 border-t text-xs">
          <span className="text-muted-foreground">Source</span>
          <span>Landsat 8/9 thermal, free</span>
          <span className="text-muted-foreground">Resolution</span>
          <span>About 100 m pixels</span>
          <span className="text-muted-foreground">Scenes</span>
          <span>Not prepared yet</span>
          <span className="text-muted-foreground">Time of day</span>
          <span>Morning pass, around 10:30</span>
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t">
          This layer is a design placeholder - no real heat data has been prepared yet (see ESCH-HEAT-PROFILE-PLAN.md
          Step 3).
        </p>
      </CardContent>
    </Card>
  )
}
