"use client"

import { useEffect, useRef, useState } from "react"

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; data: T }

const LOADING = { status: "loading" } as const

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Runs `load` whenever `key` changes and returns its state. `key` stands for everything the
 * load depends on (e.g. "9650,2163038|no2|week"), so callers don't depend on object
 * identity. A `null` key means "don't load"; the state stays "loading".
 *
 * The previous load is aborted (its signal fires and its result is ignored) when the key
 * changes or the component unmounts. Results aren't cached: a key that comes back after
 * a null or another key loads again, so a failure is never kept.
 *
 * Keep this the only place that knows how loading works, so a data library could replace
 * its body without touching callers.
 */
export function useAsync<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [result, setResult] = useState<{ key: string; state: AsyncState<T> } | null>(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (key === null) return
    const controller = new AbortController()
    const settle = (state: AsyncState<T>) => {
      if (!controller.signal.aborted) setResult({ key, state })
    }
    loadRef.current(controller.signal).then(
      (data) => settle({ status: "ready", data }),
      (error: unknown) => settle({ status: "error", error: toError(error) }),
    )
    return () => {
      controller.abort()
      setResult((current) => (current?.key === key ? null : current))
    }
  }, [key])

  return result !== null && result.key === key ? result.state : LOADING
}
