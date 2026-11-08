import { LIMIT_STATUS_COLOR, type LimitStatus } from "@/domain/limits"

export function LimitStatusDot({ status }: { status: LimitStatus }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: LIMIT_STATUS_COLOR[status] }} />
}
