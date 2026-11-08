import type { CommuneArea } from "@/domain/area"

export const ESCH_SUR_ALZETTE: CommuneArea = {
  kind: "commune",
  slug: "esch-sur-alzette",
  name: "Esch-sur-Alzette",
  center: [5.9741, 49.4989],
  zoom: 13.8,
  // Esch/Alzette and Esch Gare.
  stationIds: [9650, 2163038],
  datasets: { no2Tubes: true, heat: true },
}
