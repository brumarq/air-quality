import { CommuneReadingsPanel } from "@/features/air-quality"
import { NO2ReductionCard, NO2TubeDetailCard, NO2TubesMessage } from "@/features/no2-tubes"
import { NO2_LIMITS } from "@/domain/limits"
import type { AreaTubes } from "./use-area-tubes"
import type { useAirMode } from "./use-air-mode"

/** The left-column cards in air-quality mode: readings, then the NO2 tubes if the area has any. */
export function AirModeCards({ air, tubes }: { air: ReturnType<typeof useAirMode>; tubes: AreaTubes }) {
  return (
    <>
      <CommuneReadingsPanel history={air.readings} selectedLimit={air.limit} range={air.range} onSelectParameter={air.setParameter} />
      {tubes.status === "loading" && <NO2TubesMessage role="status">Loading NO₂ tube data...</NO2TubesMessage>}
      {tubes.status === "error" && <NO2TubesMessage role="alert">Couldn&apos;t load NO₂ tube data.</NO2TubesMessage>}
      {tubes.status === "ready" &&
        (air.selectedTubeId ? (
          <NO2TubeDetailCard dataset={tubes.dataset} limits={NO2_LIMITS} tubeId={air.selectedTubeId} onBack={() => air.setSelectedTubeId(null)} />
        ) : (
          <NO2ReductionCard dataset={tubes.dataset} limits={NO2_LIMITS} selectedTubeId={air.selectedTubeId} onSelectTube={air.setSelectedTubeId} />
        ))}
    </>
  )
}
