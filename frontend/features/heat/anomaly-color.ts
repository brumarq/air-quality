import { tokens } from "@/theme/tokens"

// One anomaly colour scale for the map fill, the legend and the detail card's bars:
// linear interpolation between the stops in theme/tokens.ts, in RGB like Mapbox's
// `interpolate`. Values outside the stops take the end colours.

const STOPS = tokens.heat.anomaly

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex = (channels: number[]) => `#${channels.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase()}`

export function heatAnomalyColor(anomalyC: number | null): string {
  if (anomalyC === null) return tokens.chart.noData
  const first = STOPS[0]
  const last = STOPS[STOPS.length - 1] ?? first
  if (anomalyC <= first[0]) return first[1]
  if (anomalyC >= last[0]) return last[1]
  const upperIndex = STOPS.findIndex(([stop]) => stop >= anomalyC)
  const upper = STOPS[upperIndex] ?? last
  const lower = STOPS[upperIndex - 1] ?? first
  const t = (anomalyC - lower[0]) / (upper[0] - lower[0])
  const [a, b] = [rgb(lower[1]), rgb(upper[1])]
  return toHex(a.map((channel, i) => channel + ((b[i] ?? channel) - channel) * t))
}
