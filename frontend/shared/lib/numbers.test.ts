import { describe, expect, it } from "vitest"
import {
  MISSING,
  formatCelsius,
  formatCelsiusDifference,
  formatConcentration,
  formatConcentrationDifferenceNumber,
  formatConcentrationNumber,
  formatCount,
  formatLimit,
  formatLimitNumber,
  formatNdvi,
  formatPercentChange,
} from "./numbers"

describe("number formatting", () => {
  it("formatCelsius", () => {
    expect(formatCelsius(23.44)).toBe("23.4°C")
    expect(formatCelsius(null)).toBe(MISSING)
    expect(formatCelsius(-0.04)).toBe("-0.0°C")
  })

  it("formatCelsiusDifference", () => {
    expect(formatCelsiusDifference(6.24)).toBe("+6.2°C")
    expect(formatCelsiusDifference(-1.4)).toBe("-1.4°C")
    expect(formatCelsiusDifference(null)).toBe(MISSING)
    expect(formatCelsiusDifference(-0.04)).toBe("0.0°C")
  })

  it("formatConcentration writes µg/m³ itself, as Intl has no unit for it", () => {
    expect(formatConcentration(38.26)).toBe("38.3 µg/m³")
    expect(formatConcentration(null)).toBe(MISSING)
    expect(formatConcentration(-0.04)).toBe("-0.0 µg/m³")
  })

  it("formatConcentrationNumber", () => {
    expect(formatConcentrationNumber(28)).toBe("28.0")
    expect(formatConcentrationNumber(null)).toBe(MISSING)
    expect(formatConcentrationNumber(-0.04)).toBe("-0.0")
  })

  it("formatLimit writes limits as the law does, with no forced decimal", () => {
    expect(formatLimit(20)).toBe("20 µg/m³")
    expect(formatLimit(2.5)).toBe("2.5 µg/m³")
    expect(formatLimit(-0.04)).toBe("-0 µg/m³")
  })

  it("formatLimitNumber", () => {
    expect(formatLimitNumber(40)).toBe("40")
    expect(formatLimitNumber(-0.04)).toBe("-0")
  })

  it("formatConcentrationDifferenceNumber", () => {
    expect(formatConcentrationDifferenceNumber(2.06)).toBe("+2.1")
    expect(formatConcentrationDifferenceNumber(-1.4)).toBe("-1.4")
    expect(formatConcentrationDifferenceNumber(null)).toBe(MISSING)
    expect(formatConcentrationDifferenceNumber(-0.04)).toBe("0.0")
  })

  it("formatPercentChange takes percent, so 35 means 35%", () => {
    expect(formatPercentChange(35)).toBe("+35%")
    expect(formatPercentChange(-8.2)).toBe("-8%")
    expect(formatPercentChange(null)).toBe(MISSING)
    expect(formatPercentChange(-0.04)).toBe("0%")
  })

  it("formatNdvi", () => {
    expect(formatNdvi(0.423)).toBe("0.42")
    expect(formatNdvi(null)).toBe(MISSING)
    expect(formatNdvi(-0.04)).toBe("-0.04")
  })

  it("formatCount", () => {
    expect(formatCount(8760)).toBe("8,760")
    expect(formatCount(-0.04)).toBe("-0.04")
  })
})
