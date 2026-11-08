import type { z } from "zod"

/**
 * The outcome of loading a commune's prepared data file. "not-prepared" (HTTP 404) means
 * the pipeline hasn't produced this file for the commune; anything else that goes wrong
 * is an "error", which the UI must show rather than treat as "no data".
 */
export type LoadResult<T> = { status: "ok"; data: T } | { status: "not-prepared" } | { status: "error"; error: Error }

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

/** Fetches and validates one JSON file from public/data. Never throws. */
export async function loadStaticJson<T>(
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  signal?: AbortSignal,
): Promise<LoadResult<T>> {
  try {
    // no-store: these files only change when the pipeline reruns, and a stale copy right
    // after a rerun would show numbers that disagree with the published report.
    const response = await fetch(path, { cache: "no-store", signal })
    if (response.status === 404) return { status: "not-prepared" }
    if (!response.ok) return { status: "error", error: new Error(`GET ${path} failed: ${response.status}`) }
    const parsed = schema.safeParse(await response.json())
    if (!parsed.success) return { status: "error", error: new Error(`${path} has an unexpected shape: ${parsed.error.message}`) }
    return { status: "ok", data: parsed.data }
  } catch (error) {
    return { status: "error", error: toError(error) }
  }
}
