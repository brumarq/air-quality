"use client"

import Link from "next/link"
import { ChevronDown, Map, MapPin } from "lucide-react"
import type { Area } from "@/content/area"
import { LUXEMBOURG } from "@/content/areas/luxembourg"
import { COMMUNES } from "@/content/communes"
import { Badge } from "@/shared/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { CardContent } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

const AREA_MODES = ["air", "heat"] as const
export type AreaMode = (typeof AREA_MODES)[number]

const isAreaMode = (value: string): value is AreaMode => AREA_MODES.some((mode) => mode === value)

interface CommuneHeaderCardProps {
  area: Area
  mode: AreaMode
  onSelectMode: (mode: AreaMode) => void
  modeControls?: React.ReactNode
}

export function CommuneHeaderCard({
  area,
  mode,
  onSelectMode,
  modeControls,
}: CommuneHeaderCardProps) {
  return (
    <FloatingCard>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm">
            <span className="text-brand" aria-hidden="true">
              ◎
            </span>
            <span className="font-semibold">LuxAir</span>
            <span className="text-ink-faint" aria-hidden="true">
              /
            </span>
            <span className="text-muted-foreground">{area.kind === "commune" ? "Commune profile" : "National overview"}</span>
          </span>
          <Badge variant="outline">Draft</Badge>
        </div>

        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2 text-xl font-semibold leading-none">
                {area.name}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuItem asChild disabled={area.kind === "country"}>
                <Link href="/" className="flex items-center gap-3">
                  <Map className="h-4 w-4" />
                  <span className="flex-1">{LUXEMBOURG.name}</span>
                  <span className="text-xs text-muted-foreground">All {LUXEMBOURG.openAqLocationIds.length} stations</span>
                </Link>
              </DropdownMenuItem>
              {COMMUNES.map((commune) => (
                <DropdownMenuItem key={commune.slug} asChild disabled={area.kind === "commune" && commune.slug === area.slug}>
                  <Link href={`/communes/${commune.slug}`} className="flex items-center gap-3 font-medium">
                    <MapPin className="h-4 w-4" />
                    <span className="flex-1">{commune.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-sm text-muted-foreground">
            {area.openAqLocationIds.length} reference stations · air quality against EU limits, and summer heat
          </p>
        </div>

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => isAreaMode(value) && onSelectMode(value)}
          className="bg-muted rounded-lg p-1 gap-1"
        >
          <ToggleGroupItem value="air" className="flex-1 h-8 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Air quality
          </ToggleGroupItem>
          <ToggleGroupItem value="heat" className="flex-1 h-8 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Summer heat
          </ToggleGroupItem>
        </ToggleGroup>

        {modeControls}
      </CardContent>
    </FloatingCard>
  )
}
