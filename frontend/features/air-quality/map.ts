"use client"

import type { LayerSpecification, Map as MapboxMap } from "mapbox-gl"
import { z } from "zod"
import type { AirQualityStation } from "./model"
import { tokens } from "@/shared/theme/tokens"
import { useMemo } from "react"
import { firstFeaturePoint, firstFeatureProperties } from "@/shared/map/feature-properties"
import { useMapLayer } from "@/shared/map/use-map-layer"

const STATION_SOURCE_ID = "air-quality-data"
const STATION_LAYER_ID = "air-quality-stations"
const STATION_LABEL_LAYER_ID = "air-quality-labels"

const MARKER_RADIUS = 10
const MARKER_RADIUS_HOVER = 12

const StationFeatureProperties = z.object({ id: z.number(), name: z.string() })

function stationsGeoJson(stations: AirQualityStation[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: { id: station.id, name: station.name } satisfies z.infer<typeof StationFeatureProperties>,
      geometry: { type: "Point", coordinates: [station.lng, station.lat] },
    })),
  }
}

const STATION_LAYERS: LayerSpecification[] = [
  {
    id: STATION_LAYER_ID,
    type: "circle",
    source: STATION_SOURCE_ID,
    paint: {
      "circle-radius": MARKER_RADIUS,
      "circle-color": tokens.map.stationFill,
      "circle-opacity": 0.9,
      "circle-stroke-width": 2,
      "circle-stroke-color": tokens.map.stationStroke,
    },
  },
  {
    id: STATION_LABEL_LAYER_ID,
    type: "symbol",
    source: STATION_SOURCE_ID,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": tokens.map.stationLabel },
  },
]

export function useStationLayers(map: MapboxMap | null, stations: AirQualityStation[]) {
  const data = useMemo(() => stationsGeoJson(stations), [stations])

  useMapLayer(map, {
    sourceId: STATION_SOURCE_ID,
    data,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: STATION_LAYERS,
    events: {
      [STATION_LAYER_ID]: {
        click: (event) => {
          const station = firstFeatureProperties(event, StationFeatureProperties)
          const point = firstFeaturePoint(event)
          if (!map || !station || !point || !stations.some((s) => s.id === station.id)) return
          map.flyTo({ center: point, zoom: Math.max(map.getZoom(), 11.5), duration: 1000, essential: true })
        },
        mouseenter: () => {
          if (!map) return
          map.getCanvas().style.cursor = "pointer"
          map.setPaintProperty(STATION_LAYER_ID, "circle-radius", MARKER_RADIUS_HOVER)
        },
        mouseleave: () => {
          if (!map) return
          map.getCanvas().style.cursor = ""
          map.setPaintProperty(STATION_LAYER_ID, "circle-radius", MARKER_RADIUS)
        },
      },
    },
  })
}
