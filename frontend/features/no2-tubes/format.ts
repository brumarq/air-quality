/** One decimal at most, trailing zero dropped: 27 -> "27", 45.43 -> "45.4", -1.0 -> "-1". */
export function formatOneDecimal(value: number): string {
  return String(Number(value.toFixed(1)))
}

export function formatSigned(value: number, format: (v: number) => string): string {
  const text = format(value)
  return Number(text) > 0 ? `+${text}` : text
}
