const PARAMETER_LABELS: Record<string, string> = {
  no2: "NO₂",
  no: "NO",
  pm25: "PM2.5",
  pm10: "PM10",
  o3: "O₃",
  so2: "SO₂",
  co: "CO",
}

export function formatParameterLabel(parameter: string): string {
  return PARAMETER_LABELS[parameter] ?? parameter.toUpperCase()
}
