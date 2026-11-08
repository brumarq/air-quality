import type { LimitStatus } from "@/domain/limits"
import { tokens } from "@/theme/tokens"

export const LIMIT_STATUS_COLOR: Record<LimitStatus, string> = {
  "below-2030": tokens.status.below2030,
  "above-2030": tokens.status.above2030,
  "above-today": tokens.status.aboveToday,
}
