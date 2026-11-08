"use client"

import Link from "next/link"
import { ChevronDown, Map, MapPin } from "lucide-react"
import type { CommuneConfig } from "@/domain/communes"
import { communes } from "@/domain/communes"
import { RANGE_KEYS, TIME_RANGES, isRangeKey, type RangeKey } from "@/domain/time-ranges"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AreaMode = "air" | "heat"

interface CommuneHeaderCardProps {
  communeConfig: CommuneConfig
  mode: AreaMode
  onSelectMode: (mode: AreaMode) => void
  selectedRangeKey: RangeKey
  onSelectRange: (key: RangeKey) => void
}

export function CommuneHeaderCard({
  communeConfig,
  mode,
  onSelectMode,
  selectedRangeKey,
  onSelectRange,
}: CommuneHeaderCardProps) {
  return (
    <Card className="pointer-events-auto w-96 shadow-lg">
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
            <span className="text-muted-foreground">{communeConfig.slug ? "Commune profile" : "National overview"}</span>
          </span>
          <Badge variant="outline">Draft</Badge>
        </div>

        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2 text-xl font-semibold leading-none">
                {communeConfig.name}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuItem asChild disabled={!communeConfig.slug}>
                <Link href="/" className="flex items-center gap-3">
                  <Map className="h-4 w-4" />
                  <span className="flex-1">Luxembourg</span>
                  <span className="text-xs text-muted-foreground">All 9 stations</span>
                </Link>
              </DropdownMenuItem>
              {communes.map((commune) => (
                <DropdownMenuItem key={commune.slug} asChild disabled={commune.slug === communeConfig.slug}>
                  <Link href={`/communes/${commune.slug}`} className="flex items-center gap-3 font-medium">
                    <MapPin className="h-4 w-4" />
                    <span className="flex-1">{commune.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-sm text-muted-foreground">
            {communeConfig.stationIds.length} reference stations · air quality against EU limits, and summer heat
          </p>
        </div>

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && onSelectMode(value as AreaMode)}
          className="bg-muted rounded-lg p-1 gap-1"
        >
          <ToggleGroupItem value="air" className="flex-1 h-8 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Air quality
          </ToggleGroupItem>
          <ToggleGroupItem value="heat" className="flex-1 h-8 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
            Summer heat
          </ToggleGroupItem>
        </ToggleGroup>

        {mode === "air" && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Period</span>
            <ToggleGroup
              type="single"
              value={selectedRangeKey}
              onValueChange={(value) => isRangeKey(value) && onSelectRange(value)}
              className="bg-muted rounded-lg p-1 gap-1 grid"
              style={{ gridTemplateColumns: `repeat(${RANGE_KEYS.length}, minmax(0, 1fr))` }}
            >
              {RANGE_KEYS.map((key) => TIME_RANGES[key]).map((range) => (
                <ToggleGroupItem
                  key={range.key}
                  value={range.key}
                  className="h-8 px-1 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm"
                >
                  {range.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
