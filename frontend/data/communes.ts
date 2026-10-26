export interface CommuneConfig {
  slug: string
  name: string,
  center: [number, number],
  zoom: number,
  stationIds: number[]
}

export const communes: CommuneConfig[] = [
  {
    slug: "esch-sur-alzette",
    name: "Esch-sur-Alzette",
    center: [5.9741, 49.4989],
    zoom: 13.8,
    stationIds: [9650, 2163038]
  },
]

// The root page ("/") is just another area in the same island layout - all 9 Luxembourg
// stations instead of one commune's two. Keeping it as a CommuneConfig (not a separate
// optional case) is what lets MapLayout/MapContainer render one layout for both pages.
export const LUXEMBOURG_AREA: CommuneConfig = {
  slug: "",
  name: "Luxembourg",
  center: [6.13, 49.61],
  zoom: 9,
  stationIds: [3063270, 9648, 9645, 9642, 9651, 2163033, 2163037, 9650, 2163038],
}

export function getCommuneBySlug(slug: string): CommuneConfig | undefined {
  return communes.find((commune) => commune.slug === slug)
}
