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
  studyOverlay: {
    label: "PRO-SUD study map",
    hint: "Their own modelled layer",
    attribution: "© Administration du Cadastre et de la Topographie / Geoportail.lu for the PRO-SUD layer.",
    // Geoportail's public map-layer WMS: layer 2922 is the PRO-SUD daytime heat map (2923
    // is night). Checked to be public, CORS-open and EPSG:3857-capable, and to render in
    // Mapbox GL through the {bbox-epsg-3857} tile template.
    wmsUrl: "https://wms.geoportail.lu/public_map_layers/service",
    wmsLayer: "2922",
  },
}
