// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useAsync } from "./use-async"

/** A promise the test resolves or rejects by hand, plus the signal it was started with. */
function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(initialKey: string | null) {
  const calls: { key: string | null; signal: AbortSignal; d: ReturnType<typeof deferred<string>> }[] = []
  const hook = renderHook(
    ({ key }: { key: string | null }) =>
      useAsync(key, (signal) => {
        const d = deferred<string>()
        calls.push({ key, signal, d })
        return d.promise
      }),
    { initialProps: { key: initialKey } },
  )
  const call = (i: number) => {
    const c = calls[i]
    if (!c) throw new Error(`load #${i} never started`)
    return c
  }
  return { ...hook, calls, call }
}

describe("useAsync", () => {
  it("goes from loading to ready", async () => {
    const { result, call } = setup("a")
    expect(result.current).toEqual({ status: "loading" })
    await act(async () => call(0).d.resolve("A"))
    expect(result.current).toEqual({ status: "ready", data: "A" })
  })

  it("goes from loading to error, wrapping non-Error rejections", async () => {
    const { result, call } = setup("a")
    await act(async () => call(0).d.reject("boom"))
    expect(result.current).toEqual({ status: "error", error: new Error("boom") })
  })

  it("aborts the previous load when the key changes and ignores its result", async () => {
    const { result, rerender, call } = setup("a")
    rerender({ key: "b" })
    expect(call(0).signal.aborted).toBe(true)
    expect(result.current).toEqual({ status: "loading" })

    await act(async () => call(0).d.resolve("stale A"))
    expect(result.current).toEqual({ status: "loading" })

    await act(async () => call(1).d.resolve("B"))
    expect(result.current).toEqual({ status: "ready", data: "B" })
  })

  it("aborts on unmount", () => {
    const { unmount, call } = setup("a")
    unmount()
    expect(call(0).signal.aborted).toBe(true)
  })

  it("doesn't load while the key is null", () => {
    const { result, calls } = setup(null)
    expect(calls).toHaveLength(0)
    expect(result.current).toEqual({ status: "loading" })
  })

  it("doesn't reload when only the load function's identity changes", () => {
    const { rerender, calls } = setup("a")
    rerender({ key: "a" })
    rerender({ key: "a" })
    expect(calls).toHaveLength(1)
  })

  it("loads again after a failure once the key comes back", async () => {
    const { result, rerender, call } = setup("a")
    await act(async () => call(0).d.reject(new Error("offline")))
    expect(result.current.status).toBe("error")

    rerender({ key: null })
    rerender({ key: "a" })
    expect(result.current).toEqual({ status: "loading" })
    await act(async () => call(1).d.resolve("A"))
    expect(result.current).toEqual({ status: "ready", data: "A" })
  })

  it("never leaves an unhandled rejection", async () => {
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)
    const { call } = setup("a")
    await act(async () => call(0).d.reject(new Error("boom")))
    await new Promise((r) => setTimeout(r, 0))
    process.off("unhandledRejection", onUnhandled)
    expect(onUnhandled).not.toHaveBeenCalled()
  })
})
