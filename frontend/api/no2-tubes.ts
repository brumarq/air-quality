import eschTubes from "@/data/no2-tubes/esch.json"
import type { NO2TubeDataset } from "@/domain/no2-tubes"

const DATASETS: Record<string, NO2TubeDataset> = {
  "esch-sur-alzette": eschTubes as NO2TubeDataset,
}

export function getNo2TubeDataset(communeSlug: string): NO2TubeDataset | null {
  return DATASETS[communeSlug] ?? null
}
