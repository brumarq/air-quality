// The only place colour values live. Tailwind (tailwind.config.ts), Recharts props and
// Mapbox paint all read from here, by semantic name. This file imports nothing.

export const tokens = {
  // Limit-status bands for pollutant readings.
  status: {
    below2030: "#14B8A6",
    above2030: "#FBBF24",
    aboveToday: "#F97316",
  },
  // Reference lines and markers for the two legal limits.
  limit: {
    today: "#525252",
    target2030: "#B91C1C",
  },
  // One colour per station, by index in an area's station list, so a station keeps its
  // colour in the bars, the chart and the legend. Cool hues only: warm ones are reserved
  // for the limit-status bands and reference lines, so a station colour never reads as a
  // compliance signal. The first two are Esch/Alzette and Esch Gare from the original
  // design spec.
  station: ["#0D9488", "#3730A3", "#2563EB", "#7C3AED", "#C026D3", "#DB2777", "#E11D48", "#0284C7", "#0E7490"],
  chart: {
    axis: "#737373",
    liveDotStroke: "#FFFFFF",
    barTrack: "#F0F0F0",
    noData: "#E5E7EB",
  },
  heat: {
    // Anomaly (°C vs. the commune mean) to colour, interpolated linearly between stops.
    anomaly: [
      [-10, "#2166AC"],
      [-5, "#67A9CF"],
      [0, "#F7F7F7"],
      [5, "#FDDBC7"],
      [8, "#EF8A62"],
      [12, "#B2182B"],
    ],
    // NDVI (vegetation greenness) to colour, interpolated; -1 also stands for "no data".
    ndvi: [
      [-1, "#44403C"],
      [0, "#FEF3C7"],
      [0.5, "#84CC16"],
      [0.9, "#166534"],
    ],
    gridOutline: "#FFFFFF",
    communeBoundary: "#1F2937",
    building: {
      school: "#7C3AED",
      kindergarten: "#DB2777",
      careFacility: "#0D9488",
      other: "#6B7280",
      stroke: "#FFFFFF",
    },
    study: {
      hot: "#B2182B",
      cool: "#2166AC",
      hotLabel: "#991B1B",
      coolLabel: "#1E40AF",
      separationLine: "#34D399",
      separationText: "#047857",
    },
  },
  no2: {
    // Bands of the Pacte Climat report's own classification.
    band: {
      aboveLimit: "#DC2626",
      above2030: "#F59E0B",
      aboveWho: "#22C55E",
      withinWho: "#3B82F6",
    },
    markerNoData: "#9CA3AF",
    markerStroke: "#FFFFFF",
    aboveTarget: "#B45309",
    belowTarget: "#047857",
  },
  map: {
    stationFill: "#FFFFFF",
    stationStroke: "#14B8A6",
    stationLabel: "#333333",
    countryOutline: "#D1D5DB",
  },
  ui: {
    brand: "#14B8A6",
    live: "#DC2626",
    textStrong: "#404040",
    textSoft: "#525252",
    textFaint: "#D4D4D4",
    noticeBackground: "#FFFBEB",
    noticeText: "#B45309",
    controlBackground: "#FFFFFF",
    hoverScrim: "#000000",
  },
} as const
