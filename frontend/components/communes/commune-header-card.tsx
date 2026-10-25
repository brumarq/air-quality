import type { CommuneConfig } from "@/data/communes"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CommuneHeaderCard({ communeConfig }: { communeConfig: CommuneConfig }) {
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
      </CardContent>
    </Card>
  )
}
