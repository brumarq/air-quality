import type { LimitStatus } from "@/domain/limits"
import { LIMIT_STATUS_COLOR } from "./limit-colors"

export function LimitStatusDot({ status }: { status: LimitStatus }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: LIMIT_STATUS_COLOR[status] }} />
}
