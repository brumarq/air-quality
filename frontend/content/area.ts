import type { HeatStudyContent, StudyOverlay } from "@/features/heat/model"
import type { LngLat } from "@/shared/domain/geo"

interface AreaBase {
  name: string
  center: LngLat
  zoom: number
  openAqLocationIds: number[]
}

export interface CountryArea extends AreaBase {
  kind: "country"
  bounds: readonly [southWest: LngLat, northEast: LngLat]
}

export interface CommuneArea extends AreaBase {
  kind: "commune"
  slug: string
  datasets: { no2Tubes: boolean; heat: boolean }
  studyOverlay?: StudyOverlay
  heatStudy?: HeatStudyContent
  heatTubeCallout?: { label: string; studyPointName: string; tubeId: string; heatText: string }
  heatIndustryNote?: string
}

export type Area = CountryArea | CommuneArea
