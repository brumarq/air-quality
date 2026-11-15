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
