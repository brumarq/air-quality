import { Card, CardContent } from "@/components/ui/card"

/** Stands in for the heat card while the data loads, failed, or isn't prepared. */
export function HeatMessage({ children, role }: { children: React.ReactNode; role?: "alert" | "status" }) {
  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
      <CardContent className="p-4">
        <p role={role} className="text-sm text-muted-foreground">
          {children}
        </p>
      </CardContent>
    </Card>
  )
}
