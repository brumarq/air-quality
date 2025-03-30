// Get color based on AQI value
export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "#14B8A6" // Good - teal
  if (aqi <= 100) return "#FBBF24" // Moderate - amber
  if (aqi <= 150) return "#F97316" // Unhealthy for Sensitive Groups - orange
  if (aqi <= 200) return "#EF4444" // Unhealthy - red
  if (aqi <= 300) return "#8B5CF6" // Very Unhealthy - purple
  return "#DB2777" // Hazardous - pink
}

// Get RGB values for AQI color (for WebGL expressions)
export const getAQIColorRGB = (aqi: number): number[] => {
  if (aqi <= 50) return [20, 184, 166] // teal
  if (aqi <= 100) return [251, 191, 36] // amber
  if (aqi <= 150) return [249, 115, 22] // orange
  if (aqi <= 200) return [239, 68, 68] // red
  if (aqi <= 300) return [139, 92, 246] // purple
  return [219, 39, 119] // pink
}

// Get trend arrow
export const getTrendArrow = (trend: string): string => {
  switch (trend) {
    case "increasing":
      return "↑"
    case "decreasing":
      return "↓"
    default:
      return "→"
  }
}

// Get trend color
export const getTrendColor = (trend: string): string => {
  switch (trend) {
    case "increasing":
      return "#EF4444" // red
    case "decreasing":
      return "#10B981" // green
    default:
      return "#6B7280" // gray
  }
}

// Get AQI category
export const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Sensitive"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

