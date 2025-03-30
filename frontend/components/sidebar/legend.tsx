import { getAQIColor } from "@/lib/utils/aqi-utils"

export function Legend() {
  const legendItems = [
    { range: "0-50", label: "Good", color: getAQIColor(25) },
    { range: "51-100", label: "Moderate", color: getAQIColor(75) },
    { range: "101-150", label: "Sensitive", color: getAQIColor(125) },
    { range: "151-200", label: "Unhealthy", color: getAQIColor(175) },
    { range: "201-300", label: "Very Unhealthy", color: getAQIColor(250) },
    { range: "301+", label: "Hazardous", color: getAQIColor(350) },
  ]

  return (
    <div className="p-5 border-b">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Legend</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs">
              {item.range}: {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

