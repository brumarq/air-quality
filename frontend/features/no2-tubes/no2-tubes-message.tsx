import { Card, CardContent } from "@/components/ui/card"

/** Stands in for the tube cards while their data loads or when it failed to. */
export function NO2TubesMessage({ children, role }: { children: React.ReactNode; role?: "alert" | "status" }) {
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
