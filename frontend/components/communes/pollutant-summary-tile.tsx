import type { PollutantLimit } from "@/lib/constants/air-quality-limits"

interface PollutantSummaryTileProps {
  limit: PollutantLimit
  selected: boolean
  onSelect: () => void
}

export function PollutantSummaryTile({ limit, selected, onSelect }: PollutantSummaryTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border rounded-lg p-3 transition-colors hover:border-primary/50 ${
        selected ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      <div className="text-sm font-semibold">{limit.label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{limit.unit}</div>
    </button>
  )
}
