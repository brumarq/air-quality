// path: features/heat/fixture.tsx
// expect: no-restricted-syntax
import type mapboxgl from "mapbox-gl"
export function Panel({ map }: { map: mapboxgl.Map | null }) {
  return <button onClick={() => map?.zoomIn()}>+</button>
}
