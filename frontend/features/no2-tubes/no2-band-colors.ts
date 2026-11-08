import type { No2Band } from "@/domain/no2-tubes"
import { tokens } from "@/theme/tokens"

export const NO2_BAND_COLOR: Record<No2Band, string> = {
  "above-limit": tokens.no2.band.aboveLimit,
  "above-2030": tokens.no2.band.above2030,
  "above-who": tokens.no2.band.aboveWho,
  "within-who": tokens.no2.band.withinWho,
}
