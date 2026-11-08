import { LIMIT_STATUS_LABEL, LIMIT_STATUS_ORDER } from "@/domain/limits"
import { LimitStatusDot } from "./limit-status-dot"

export function LimitStatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {LIMIT_STATUS_ORDER.map((status) => (
        <span key={status} className="flex items-center gap-2">
          <LimitStatusDot status={status} />
          {LIMIT_STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  )
}
