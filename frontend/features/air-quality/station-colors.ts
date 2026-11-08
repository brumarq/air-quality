import { tokens } from "@/theme/tokens"

/** A station's colour, by its index in the area's station list. */
export function stationColor(index: number): string {
  return tokens.station[index % tokens.station.length] ?? tokens.station[0]
}
