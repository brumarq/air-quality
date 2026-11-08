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
}

/** One commune's profile page, at /communes/<slug>. */
export interface CommuneArea extends AreaBase {
  kind: "commune"
  slug: string
  /** Which prepared files exist under public/data/<slug>/. */
  datasets: { no2Tubes: boolean; heat: boolean }
}

export type Area = CountryArea | CommuneArea
