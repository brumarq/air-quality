// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { POLLUTANT_LIMITS } from "@/domain/limits"
import type { AirQualityStation } from "@/domain/air-quality"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { ESCH_ALZETTE, ESCH_GARE, FIXED_NOW } from "@/test/esch"
import { useSensorHistory } from "./use-sensor-history"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(FIXED_NOW)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const stations: AirQualityStation[] = [ESCH_ALZETTE, ESCH_GARE]

describe("useSensorHistory", () => {
  it("loads every station's readings and returns the window it fetched", async () => {
    stubFetchWithFixtures()
    const { result } = renderHook(() => useSensorHistory(stations, POLLUTANT_LIMITS.no2, 1))
    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") return
    expect(result.current.data.window).toEqual({ from: new Date("2026-11-07T12:00:00Z"), to: FIXED_NOW })
    expect(result.current.data.stations.map((s) => s.points.length)).toEqual([11, 0])
  })

  it("ends in an error state, not a permanent 'loading', when a request fails", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("down", { status: 503 })))
    const unhandled = vi.fn()
    process.on("unhandledRejection", unhandled)
    const { result } = renderHook(() => useSensorHistory(stations, POLLUTANT_LIMITS.no2, 1))
    await waitFor(() => expect(result.current.status).toBe("error"))
    process.off("unhandledRejection", unhandled)
    expect(unhandled).not.toHaveBeenCalled()
  })

  it("doesn't refetch when the parent passes an equal but new stations array", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response("[]")))
    vi.stubGlobal("fetch", fetchSpy)
    const { rerender, result } = renderHook(({ list }) => useSensorHistory(list, POLLUTANT_LIMITS.no2, 1), {
      initialProps: { list: [...stations] },
    })
    await waitFor(() => expect(result.current.status).toBe("ready"))
    rerender({ list: [...stations] })
    rerender({ list: [...stations] })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("doesn't load while stations is null", () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    renderHook(() => useSensorHistory(null, POLLUTANT_LIMITS.no2, 1))
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
