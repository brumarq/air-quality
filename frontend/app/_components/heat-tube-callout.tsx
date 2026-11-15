import type { CommuneArea } from "@/content/area"
import type { HeatMapData } from "@/features/heat/model"
import { NO2_TARGET_YEAR } from "@/shared/domain/limits"
import { getReductionNeeded, type No2TubeDataset } from "@/features/no2-tubes/model"
import { formatPercentChange } from "@/shared/lib/numbers"

interface HeatTubeCalloutProps {
  callout: NonNullable<CommuneArea["heatTubeCallout"]>
  heat: HeatMapData
  tubes: No2TubeDataset | null
}

export function HeatTubeCallout({ callout, heat, tubes }: HeatTubeCalloutProps) {
  const studyPoint = heat.studyComparison?.points.find((p) => p.name === callout.studyPointName)
  const reduction = tubes && getReductionNeeded(tubes).find((r) => r.tubeId === callout.tubeId)
  if (!studyPoint || reduction?.status !== "ok" || reduction.pctVsTarget <= 0) return null

  return (
    <p className="text-xs text-ink-strong pt-3 border-t">
      <span className="font-medium">{callout.label}:</span> {callout.heatText}, and NO₂ still{" "}
      <span className="font-semibold">{formatPercentChange(reduction.pctVsTarget)}</span> above the {NO2_TARGET_YEAR} value.
    </p>
  )
}
