// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { useMapboxInstance } from "./use-mapbox-instance"

// The hook reads the token when its module loads, so set it before the imports run.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test"
})

const { removeSpy } = vi.hoisted(() => ({ removeSpy: vi.fn() }))

vi.mock("mapbox-gl", () => {
  class FakeMap {
    on() {
      return this
    }
    remove() {
      removeSpy()
    }
  }
  return { default: { accessToken: "", Map: FakeMap } }
})

function MapHost() {
  const { mapContainer } = useMapboxInstance({ initialLng: 0, initialLat: 0, initialZoom: 1 })
  return <div ref={mapContainer} />
}

describe("useMapboxInstance", () => {
  it.fails("removes the map when the component unmounts", () => {
    render(<MapHost />).unmount()
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it.fails("removes its window resize listener when the component unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener")
    render(<MapHost />).unmount()
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function))
  })
})
