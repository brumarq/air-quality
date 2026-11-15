export const LOCALE = "en-GB"

export const MISSING = "—"

const celsius = new Intl.NumberFormat(LOCALE, { style: "unit", unit: "celsius", minimumFractionDigits: 1, maximumFractionDigits: 1 })
const celsiusDifference = new Intl.NumberFormat(LOCALE, { style: "unit", unit: "celsius", signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1 })
const oneDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const upToOneDecimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })
const oneDecimalDifference = new Intl.NumberFormat(LOCALE, { signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1 })
const percentChange = new Intl.NumberFormat(LOCALE, { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 0 })
const twoDecimals = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = new Intl.NumberFormat(LOCALE)

export function formatCelsius(value: number | null): string {
  return value === null ? MISSING : celsius.format(value)
}

export function formatCelsiusDifference(value: number | null): string {
  return value === null ? MISSING : celsiusDifference.format(value)
}

export function formatConcentration(value: number | null): string {
  return value === null ? MISSING : `${oneDecimal.format(value)} µg/m³`
}

export function formatConcentrationNumber(value: number | null): string {
  return value === null ? MISSING : oneDecimal.format(value)
}

export function formatLimit(value: number): string {
  return `${upToOneDecimal.format(value)} µg/m³`
}

export function formatLimitNumber(value: number): string {
  return upToOneDecimal.format(value)
}

export function formatConcentrationDifferenceNumber(value: number | null): string {
  return value === null ? MISSING : oneDecimalDifference.format(value)
}

export function formatPercentChange(percent: number | null): string {
  return percent === null ? MISSING : percentChange.format(percent / 100)
}

export function formatNdvi(value: number | null): string {
  return value === null ? MISSING : twoDecimals.format(value)
}

export function formatCount(value: number): string {
  return whole.format(value)
}
