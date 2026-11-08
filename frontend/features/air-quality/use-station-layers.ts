"use client"

import { useMemo, useState } from "react"
import type mapboxgl from "mapbox-gl"
import type { AirQualityStation } from "@/domain/air-quality"
import { featurePoint, featureProperties } from "@/map/feature-properties"
import { useMapLayer } from "@/map/use-map-layer"
import {
  MARKER_RADIUS,
  MARKER_RADIUS_HOVER,
  STATION_LAYER_ID,
  STATION_LAYERS,
  STATION_SOURCE_ID,
  StationFeatureProperties,
  stationsGeoJson,
} from "./station-layers"

/** Draws station markers and labels, and flies to a station when it's clicked. */
export function useStationLayers(map: mapboxgl.Map | null, stations: AirQualityStation[]) {
  const [hovered, setHovered] = useState(false)
  const data = useMemo(() => stationsGeoJson(stations), [stations])

  useMapLayer(map, {
    sourceId: STATION_SOURCE_ID,
    data,
    source: (geojson) => ({ type: "geojson", data: geojson }),
    layers: STATION_LAYERS,
    paint: { [STATION_LAYER_ID]: { "circle-radius": hovered ? MARKER_RADIUS_HOVER : MARKER_RADIUS } },
    events: {
      [STATION_LAYER_ID]: {
        click: (event) => {
          const station = featureProperties(event, StationFeatureProperties)
          const point = featurePoint(event)
          if (!map || !station || !point || !stations.some((s) => s.id === station.id)) return
          map.flyTo({ center: point, zoom: Math.max(map.getZoom(), 11.5), duration: 1000, essential: true })
        },
        mouseenter: () => {
          if (map) map.getCanvas().style.cursor = "pointer"
          setHovered(true)
        },
        mouseleave: () => {
          if (map) map.getCanvas().style.cursor = ""
          setHovered(false)
        },
      },
    },
  })
}
