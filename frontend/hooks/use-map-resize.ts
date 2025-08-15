"use client"

import { useCallback, useEffect } from "react"

/**
 * Hook to handle map resize when layout changes occur
 */
export function useMapResize(map: mapboxgl.Map | null, trigger: any) {
  const handleResize = useCallback(() => {
    if (map) {
      map.resize()
    }
  }, [map])

  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.resize()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [trigger, map])

  return handleResize
}
