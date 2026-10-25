"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { communes } from "@/data/communes"

export function MapControls() {
  const pathname = usePathname()

  return (
    <div className="p-5 border-b">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Map Controls</h2>
      <div className="space-y-2">
        <Button
          variant={pathname === "/" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link href="/">
            <Map className="h-4 w-4 mr-2" />
            <span>Luxembourg</span>
          </Link>
        </Button>

        {communes.map((commune) => (
          <Button
            key={commune.slug}
            variant={pathname === `/communes/${commune.slug}` ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={`/communes/${commune.slug}`}>
              <MapPin className="h-4 w-4 mr-2" />
              <span>{commune.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

