import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { Card } from "./card"

/** A card floating over the map. It takes pointer events back from the layout around it, which lets them through to the map. */
export function FloatingCard({ className, children }: { className?: string; children: ReactNode }) {
  return <Card className={cn("pointer-events-auto w-96 shadow-lg", className)}>{children}</Card>
}
