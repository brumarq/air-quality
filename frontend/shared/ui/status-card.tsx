import { CardContent } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"

/** Stands in for a feature's cards while their data loads, failed, or isn't prepared. */
export function StatusCard({ children, role }: { children: React.ReactNode; role?: "alert" | "status" }) {
  return (
    <FloatingCard>
      <CardContent className="p-4">
        <p role={role} className="text-sm text-muted-foreground">
          {children}
        </p>
      </CardContent>
    </FloatingCard>
  )
}
