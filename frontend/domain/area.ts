import type { HeatStudyContent, StudyOverlay } from "@/domain/heat"
import type { LngLat } from "@/domain/shared/geo"

interface AreaBase {
  name: string
  /** Where the map opens. */
  center: LngLat
  zoom: number
  /** The reference stations shown for this area (OpenAQ location ids). */
  stationIds: number[]
}

/** The national overview: every station, no commune datasets. */
export interface CountryArea extends AreaBase {
  kind: "country"
  /** South-west and north-east corners of the box outlined on every map, for orientation. */
  bounds: readonly [LngLat, LngLat]
}

/** One commune's profile page, at /communes/<slug>. */
export interface CommuneArea extends AreaBase {
  kind: "commune"
  slug: string
  /** Which prepared files exist under public/data/<slug>/. */
  datasets: { no2Tubes: boolean; heat: boolean }
  /** The commune's own heat study as a map overlay, if it has a public one. */
  studyOverlay?: StudyOverlay
  /** The commune's own heat study, if it has one, for the heat story panel. */
  heatStudy?: HeatStudyContent
  /** A place that's both a heat hotspot in the study and an NO2 tube site, called out in
   *  heat mode. Linked by the study point's exact name and the tube's id. */
  heatTubeCallout?: { label: string; studyPointName: string; tubeId: string; heatText: string }
}

export type Area = CountryArea | CommuneArea
