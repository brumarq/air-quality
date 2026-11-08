import { describe, expect, it } from "vitest"
import { tokens } from "@/theme/tokens"
import { heatAnomalyColor } from "./anomaly-color"
import { anomalyFillExpression } from "./heat-layers"

describe("one anomaly colour scale", () => {
  it("gives each stop its own colour, like the legend", () => {
    for (const [stop, color] of tokens.heat.anomaly) expect(heatAnomalyColor(stop)).toBe(color)
  })

  it("interpolates between stops, like the map's fill", () => {
    // Halfway between 0 (#F7F7F7) and 5 (#FDDBC7).
    expect(heatAnomalyColor(2.5)).toBe("#FAE9DF")
    // The old detail card stepped instead: anything in (0, 5] was #FDDBC7.
    expect(heatAnomalyColor(0.5)).not.toBe("#FDDBC7")
  })

  it("clamps outside the stops and greys out missing values", () => {
    expect(heatAnomalyColor(-40)).toBe(tokens.heat.anomaly[0][1])
    expect(heatAnomalyColor(30)).toBe("#B2182B")
    expect(heatAnomalyColor(null)).toBe(tokens.chart.noData)
  })

  it("feeds the map the same stops", () => {
    expect(JSON.stringify(anomalyFillExpression(2025))).toContain(JSON.stringify(tokens.heat.anomaly.flat()).slice(1, -1))
  })
})
