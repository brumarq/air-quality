// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { useMapboxInstance } from "./use-mapbox-instance"

const { fakeMaps } = vi.hoisted(() => ({ fakeMaps: [] as { emit: (event: string, payload?: unknown) => void; removed: number }[] }))

vi.mock("mapbox-gl", () => {
  class FakeMap {
    removed = 0
    private handlers = new Map<string, (payload?: unknown) => void>()
    constructor() {
      fakeMaps.push(this)
    }
    on(event: string, handler: (payload?: unknown) => void) {
      this.handlers.set(event, handler)
      return this
    }
    emit(event: string, payload?: unknown) {
      this.handlers.get(event)?.(payload)
    }
    addControl() {
      return this
    }
    resize() {
      return this
    }
    remove() {
      this.removed += 1
    }
  }
  class AttributionControl {}
  return { default: { accessToken: "", Map: FakeMap, AttributionControl } }
})

function MapHost() {
  const { containerRef, map, status } = useMapboxInstance({ center: [0, 0], zoom: 1 })
  return (
    <div ref={containerRef}>
      <span data-testid="status">{status.status === "error" ? `error: ${status.message}` : status.status === "ready" ? `ready: ${status.issue ?? "-"}` : "loading"}</span>
      <span data-testid="map">{map ? "map" : "no map"}</span>
    </div>
  )
}

const statusText = () => screen.getByTestId("status").textContent
const latestMap = () => {
  const map = fakeMaps.at(-1)
  if (!map) throw new Error("no map was created")
  return map
}

afterEach(() => {
  fakeMaps.length = 0
  vi.unstubAllEnvs()
})

describe("useMapboxInstance", () => {
  it("removes the map when the component unmounts", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test")
    const view = render(<MapHost />)
    const map = latestMap()
    view.unmount()
    expect(map.removed).toBe(1)
  })

  it("adds no window resize listener of its own", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test")
    const addListener = vi.spyOn(window, "addEventListener")
    render(<MapHost />).unmount()
    expect(addListener).not.toHaveBeenCalledWith("resize", expect.anything())
  })

  it("exposes the map only after it has loaded", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test")
    render(<MapHost />)
    expect(screen.getByTestId("map").textContent).toBe("no map")
    act(() => latestMap().emit("load"))
    expect(screen.getByTestId("map").textContent).toBe("map")
    expect(statusText()).toBe("ready: -")
  })

  it("reports a missing token instead of failing silently", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "")
    render(<MapHost />)
    expect(statusText()).toBe("error: no Mapbox token is configured (NEXT_PUBLIC_MAPBOX_TOKEN).")
    expect(fakeMaps).toHaveLength(0)
  })

  it("treats an error before load as fatal and one after load as a notice", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test")
    render(<MapHost />)
    act(() => latestMap().emit("error", { error: new Error("401 Unauthorized") }))
    expect(statusText()).toBe("error: 401 Unauthorized")

    act(() => latestMap().emit("load"))
    act(() => latestMap().emit("error", { error: new Error("tile failed") }))
    expect(statusText()).toBe("ready: tile failed")
  })
})
