import { describe, expect, it } from "vitest"
import { tokens } from "@/shared/theme/tokens"
import { anomalyColor, anomalyTooltip } from "./heat-mode-cards"
import { anomalyFillExpression } from "./map"

describe("one anomaly colour scale", () => {
  it("gives each stop its own colour, like the legend", () => {
    expect(tokens.heat.anomaly.map(([stop]) => anomalyColor(stop))).toEqual([
      "rgb(33, 102, 172)",
      "rgb(103, 169, 207)",
      "rgb(247, 247, 247)",
      "rgb(253, 219, 199)",
      "rgb(239, 138, 98)",
      "rgb(178, 24, 43)",
    ])
  })

  it("blends between stops in RGB like the map's interpolate fill, instead of stepping to the next stop", () => {
    const halfwayFromZeroStopToFiveStop = "rgb(250, 233, 223)"
    const fiveStop = "rgb(253, 219, 199)"
    expect(anomalyColor(2.5)).toBe(halfwayFromZeroStopToFiveStop)
    expect(anomalyColor(0.5)).not.toBe(fiveStop)
  })

  it("says no data in the tooltip for a summer without a reading, since Recharts passes the raw null", () => {
    expect(anomalyTooltip(null)).toEqual(["no data", ""])
    expect(anomalyTooltip(1.24)).toEqual(["+1.2°C vs. commune", ""])
  })

  it("clamps outside the stops", () => {
    expect(anomalyColor(-40)).toBe("rgb(33, 102, 172)")
    expect(anomalyColor(30)).toBe("rgb(178, 24, 43)")
  })

  it("feeds the map the same stops", () => {
    expect(JSON.stringify(anomalyFillExpression(2025))).toContain(JSON.stringify(tokens.heat.anomaly.flat()).slice(1, -1))
  })
})
