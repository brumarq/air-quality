import type { z } from "zod"

export type LoadResult<T> = { status: "ok"; data: T } | { status: "not-prepared" } | { status: "error"; error: Error }

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

export async function loadStaticJson<T>(
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  signal?: AbortSignal,
): Promise<LoadResult<T>> {
  try {
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
