import type { CommuneArea } from "@/domain/area"
import type { HeatMapData } from "@/domain/heat"
import { NO2_LIMITS } from "@/domain/limits"
import { getReductionNeeded, type No2TubeDataset } from "@/domain/no2-tubes"

interface HeatTubeCalloutProps {
  callout: NonNullable<CommuneArea["heatTubeCallout"]>
  heat: HeatMapData
  tubes: No2TubeDataset | null
}

/**
 * One place seen through both datasets: a hotspot in the commune's heat study that is
 * also an NO2 tube site. It joins two features' data, so it lives in app/. Hidden unless
 * both the study point and an NO2 reading for the tube exist.
 */
export function HeatTubeCallout({ callout, heat, tubes }: HeatTubeCalloutProps) {
  const studyPoint = heat.studyComparison?.points.find((p) => p.name === callout.studyPointName)
  const reduction = tubes && getReductionNeeded(tubes, NO2_LIMITS).find((r) => r.tubeId === callout.tubeId)
  if (!studyPoint || reduction?.status !== "ok") return null

  return (
    <p className="text-xs text-ink-strong pt-3 border-t">
      <span className="font-medium">{callout.label}:</span> {callout.heatText}, and NO₂ still{" "}
      <span className="font-semibold">
        {reduction.pctVsTarget > 0 ? "+" : ""}
        {reduction.pctVsTarget.toFixed(0)}%
      </span>{" "}
      above the {NO2_LIMITS.targetYear} value.
    </p>
  )
}
