// Real Esch data for tests: the captured backend readings and the static heat/NO2 files.
import { AirQualityApi } from "@/api/air-quality"
import { fetchHeatMapData } from "@/api/heat"
import { fetchNo2TubeDataset } from "@/api/no2-tubes"
import type { HeatMapData } from "@/domain/heat"
import type { No2TubeDataset } from "@/domain/no2-tubes"
import type { AirQualityStation, StationHistory } from "@/domain/air-quality"

/** The clock every time-dependent test uses: a few hours after the fixture capture. */
export const FIXED_NOW = new Date("2026-11-08T12:00:00Z")

export const ESCH_ALZETTE: AirQualityStation = {
  id: 9650,
  name: "Esch/Alzette",
  lat: 49.505,
  lng: 5.977,
  sensors: [
    { id: 29845, sensorId: 29845, parameter: "no2", unit: "µg/m³" },
    { id: 29841, sensorId: 29841, parameter: "pm10", unit: "µg/m³" },
    { id: 29840, sensorId: 29840, parameter: "pm25", unit: "µg/m³" },
  ],
}

export const ESCH_GARE: AirQualityStation = { id: 2163038, name: "Esch Gare", lat: 49.497, lng: 5.983, sensors: [] }

/** NO2 history for both Esch stations over the `days` before FIXED_NOW, via the real API client. */
export async function eschNo2History(days: number): Promise<{ history: StationHistory[]; from: Date; to: Date }> {
  const to = FIXED_NOW
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  const points = await AirQualityApi.getSensorReadingHistory(29845, from, to)
  return { history: [{ station: ESCH_ALZETTE, points }, { station: ESCH_GARE, points: [] }], from, to }
}

/** The Esch tube campaign from public/data, through the real loader. Needs the fixture fetch stub. */
export async function loadEschTubes(): Promise<No2TubeDataset> {
  const result = await fetchNo2TubeDataset("esch-sur-alzette")
  if (result.status !== "ok") throw new Error(`Esch tube data didn't load: ${result.status}`)
  return result.data
}

/** The Esch heat files from public/data, through the real loader. Needs the fixture fetch stub. */
export async function loadEschHeat(): Promise<HeatMapData> {
  const result = await fetchHeatMapData("esch-sur-alzette")
  if (result.status !== "ok") throw new Error(`Esch heat data didn't load: ${result.status}`)
  return result.data
}
