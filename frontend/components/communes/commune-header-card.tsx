import type { CommuneConfig } from "@/data/communes"
import { TIME_RANGES } from "@/lib/constants/time-ranges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CommuneHeaderCardProps {
  communeConfig: CommuneConfig
  selectedRangeKey: string
  onSelectRange: (key: string) => void
}

export function CommuneHeaderCard({ communeConfig, selectedRangeKey, onSelectRange }: CommuneHeaderCardProps) {
  return (
    <Card className="w-96 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{communeConfig.name}</h2>
          <Badge variant="outline">Draft</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          How the commune&apos;s air compares with EU limits, and where it gets hottest in summer. Public open data,
          not endorsed by any commune.
        </p>

        <div className="flex gap-1 mt-3">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.key}
              size="sm"
              variant={range.key === selectedRangeKey ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => onSelectRange(range.key)}
            >
              {range.label}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mt-3 pt-3 border-t space-y-0.5">
          <div>Readings: OpenAQ, EEA reference-grade stations</div>
          <div>Limits: EU Directives 2008/50/EC (today) and 2024/2881 (2030)</div>
        </div>
      </CardContent>
    </Card>
  )
}
