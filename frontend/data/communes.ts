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

export function getCommuneBySlug(slug: string): CommuneConfig | undefined {
  return communes.find((commune) => commune.slug === slug)
}