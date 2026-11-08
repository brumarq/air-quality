"use client"

import { useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"

export type MapStatus =
  | { status: "loading" }
  // `issue` is the latest error after the map started (e.g. a tile that failed to load).
  // The map still works, so it's shown as a notice rather than replacing the map.
  | { status: "ready"; issue: string | null }
  | { status: "error"; message: string }

interface UseMapboxInstanceProps {
  center: [number, number]
  zoom: number
}

const MISSING_TOKEN: MapStatus = {
  status: "error",
  message: "no Mapbox token is configured (NEXT_PUBLIC_MAPBOX_TOKEN).",
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error"
}

/**
 * Creates the Mapbox map once its container div mounts, and removes it (and its WebGL
 * context) when the div unmounts. `map` is only set once the style has loaded, so callers
 * can add sources and layers as soon as it's non-null.
 */
export function useMapboxInstance({ center: [lng, lat], zoom }: UseMapboxInstanceProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [status, setStatus] = useState<MapStatus>({ status: "loading" })

  useEffect(() => {
    if (!container || !token) return

    let instance: mapboxgl.Map
    try {
      mapboxgl.accessToken = token
      instance = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/standard",
        center: [lng, lat],
        zoom,
        attributionControl: false,
      })
    } catch (error) {
      setStatus({ status: "error", message: errorMessage(error) })
      return
    }

    let loaded = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    instance.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left")
    instance.on("error", (event: { error?: unknown }) => {
      const message = errorMessage(event.error)
      // Before "load", an error means the map never started (bad token, style unreachable).
      setStatus(loaded ? { status: "ready", issue: message } : { status: "error", message })
    })
    instance.on("load", () => {
      loaded = true
      setMap(instance)
      setStatus({ status: "ready", issue: null })
      // The floating cards finish laying out after the first paint; resize once they have.
      settleTimer = setTimeout(() => instance.resize(), 100)
    })

    return () => {
      clearTimeout(settleTimer)
      setMap(null)
      setStatus({ status: "loading" })
      instance.remove()
    }
  }, [container, token, lng, lat, zoom])

  return {
    containerRef: setContainer,
    map,
    status: token ? status : MISSING_TOKEN,
  }
}
