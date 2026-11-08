import { HeatDetailCard, HeatMapCard, HeatMessage } from "@/features/heat"
import type { CommuneArea } from "@/domain/area"
import type { useHeatMode } from "./use-heat-mode"

const NOT_PREPARED = "No heat-map data prepared for this commune yet."

/** The left-column card in heat mode: the map card, a clicked cell or building, or a status message. */
export function HeatModeCards({ heat, commune }: { heat: ReturnType<typeof useHeatMode>; commune: CommuneArea | null }) {
  const { load } = heat
  if (load.status === "loading") return <HeatMessage role="status">Loading heat-map data...</HeatMessage>
  if (load.status === "error" || load.data.status === "error") return <HeatMessage role="alert">Couldn&apos;t load heat data.</HeatMessage>
  if (load.data.status === "not-prepared" || heat.year === null) return <HeatMessage>{NOT_PREPARED}</HeatMessage>

  const data = load.data.data
  if (heat.selection) {
    return <HeatDetailCard data={data} selection={heat.selection} year={heat.year} onBack={() => heat.setSelection(null)} />
  }
  return (
    <HeatMapCard
      data={data}
      studyOverlay={commune?.studyOverlay ?? null}
      year={heat.year}
      onSelectYear={heat.pickYear}
      toggles={heat.toggles}
      onToggle={heat.setToggle}
    />
  )
}
