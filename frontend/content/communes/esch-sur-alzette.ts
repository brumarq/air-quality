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
  heatStudy: {
    agreesTitle: "Satellite data backs the PRO-SUD heat study",
    introBefore:
      "In 2024, the PRO-SUD communes, LIST and GEO-NET mapped summer heat across Esch and 10 neighbouring communes (",
    reportTitle: "Bioklima-Analyse für die PRO-SUD Region",
    introAfter:
      "). The study named specific hot and cool spots in Esch. Below is what satellites measured at those spots over {summers} summers.",
    reportUrl: "https://minett-biosphere.com/wp-content/uploads/2024/10/Bioklima-Analyse-Region-PRO-SUD.pdf",
    reportLinkLabel: "Read the study (PDF) ↗",
    disagreesText:
      "Checked against {years} satellite data — at least one named place didn't rank where the PRO-SUD study's naming would suggest.",
    notComparedText: "No comparison against the PRO-SUD study prepared for this commune yet.",
    methodNote: "PRO-SUD study: modelled air temperature and felt heat on one simulated day. Never blended.",
  },
  heatTubeCallout: {
    label: "Boulevard Kennedy",
    studyPointName: "Boulevard Kennedy",
    tubeId: "kennedy",
    heatText: "a heat hotspot in the PRO-SUD study",
  },
}
