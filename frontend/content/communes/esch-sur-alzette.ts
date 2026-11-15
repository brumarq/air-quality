import type { CommuneArea } from "@/content/area"

const ESCH_ALZETTE_STATION = 9650
const ESCH_GARE_STATION = 2163038
const PRO_SUD_DAYTIME_HEAT_LAYER = "2922"

export const ESCH_SUR_ALZETTE: CommuneArea = {
  kind: "commune",
  slug: "esch-sur-alzette",
  name: "Esch-sur-Alzette",
  center: [5.9741, 49.4989],
  zoom: 13.8,
  openAqLocationIds: [ESCH_ALZETTE_STATION, ESCH_GARE_STATION],
  datasets: { no2Tubes: true, heat: true },
  studyOverlay: {
    label: "PRO-SUD study map",
    hint: "Their own modelled layer",
    attribution: "© Administration du Cadastre et de la Topographie / Geoportail.lu for the PRO-SUD layer.",
    wmsUrl: "https://wms.geoportail.lu/public_map_layers/service",
    wmsLayer: PRO_SUD_DAYTIME_HEAT_LAYER,
  },
  heatStudy: {
    agreesTitle: "Satellite data backs the PRO-SUD heat study",
    introBefore:
      "In 2024, the PRO-SUD communes, LIST and GEO-NET mapped summer heat across Esch and 10 neighbouring communes (",
    reportTitle: "Bioklima-Analyse für die PRO-SUD Region",
    introAfter: (summers) =>
      `). The study named specific hot and cool spots in Esch. Below is what satellites measured at those spots over ${summers} summers.`,
    reportUrl: "https://minett-biosphere.com/wp-content/uploads/2024/10/Bioklima-Analyse-Region-PRO-SUD.pdf",
    reportLinkLabel: "Read the study (PDF) ↗",
    disagreesText: (years) =>
      `Checked against ${years} satellite data — at least one named place didn't rank where the PRO-SUD study's naming would suggest.`,
    notComparedText: "No comparison against the PRO-SUD study prepared for this commune yet.",
    methodNote: "PRO-SUD study: modelled air temperature and felt heat on one simulated day. Never blended.",
  },
  heatIndustryNote: "Industrial land excluded above: active-plant process heat isn't something commune planning can change.",
  heatTubeCallout: {
    label: "Boulevard Kennedy",
    studyPointName: "Boulevard Kennedy",
    tubeId: "kennedy",
    heatText: "a heat hotspot in the PRO-SUD study",
  },
}
