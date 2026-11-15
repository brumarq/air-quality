import { RANGE_KEYS, TIME_RANGES, isRangeKey, type RangeKey } from "./model"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

export function RangePicker({ value, onChange }: { value: RangeKey; onChange: (key: RangeKey) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-4 border-t">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Period</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => isRangeKey(next) && onChange(next)}
        className="bg-muted rounded-lg p-1 gap-1 grid"
        style={{ gridTemplateColumns: `repeat(${RANGE_KEYS.length}, minmax(0, 1fr))` }}
      >
        {RANGE_KEYS.map((key) => (
          <ToggleGroupItem
            key={key}
            value={key}
            className="h-8 px-1 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            {TIME_RANGES[key].label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
